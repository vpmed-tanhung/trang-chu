#!/usr/bin/env python3
"""Publish only an exact, human-approved catalog obtained from the private worker API."""
from __future__ import annotations
import base64, hashlib, json, os, pathlib, subprocess, urllib.request, urllib.parse, urllib.error
ROOT = pathlib.Path(__file__).resolve().parents[1]
API = 'https://jaswtdcgrfbygmdxvumu.supabase.co/functions/v1/admin-ai'
DATA = 'data/inpatient_medicines_20260707.json'
ASSET = 'assets/inpatient_medicines_20260707.js'
# A public anonymous gateway JWT is not an admin/database secret. OIDC is checked separately.
GATEWAY_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphc3d0ZGNncmZieWdtZHh2dW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0ODk1MDksImV4cCI6MjEwMjA2NTUwOX0.vI6wi_1Qpn1E5jPnnvpbWNGkH1BD8HnG0rurngU0FVE'
FIELDS = {'code','name','active','pack','route','routeBHYT','regNumber','concentration','strength','manufacturer','country','unit','dosageForm','category','note','ids','lots','expiry','id','lotCount'}

def oidc():
    url = os.environ['ACTIONS_ID_TOKEN_REQUEST_URL'] + '&audience=vpmed-admin-publisher'
    req = urllib.request.Request(url, headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)['value']

def api(path, body):
    req = urllib.request.Request(API+path, data=json.dumps(body).encode(), headers={
        'Authorization':'Bearer '+GATEWAY_ANON, 'x-github-oidc':oidc(), 'Content-Type':'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=35) as r:
        return json.load(r)

def validate(job, original_bytes):
    if not job.get('reviewed_at') or not job.get('candidate_sha256'):
        raise ValueError('HUMAN_APPROVAL_REQUIRED')
    if hashlib.sha256(original_bytes).hexdigest() != job.get('base_sha256'):
        raise ValueError('BASELINE_CHANGED_REVIEW_AGAIN')
    original = json.loads(original_bytes)
    c = job['candidate']
    if c.get('import_scope') != 'partial_overlay' or c.get('blockers') or not c.get('clinical_review_required'):
        raise ValueError('UNSAFE_IMPORT_SCOPE')
    records = c['records']
    if not isinstance(records,list) or not records or len(records)>10000:
        raise ValueError('INVALID_RECORDS')
    old = {x['code']:x for x in original}
    new = {x['code']:x for x in records}
    if len(new)!=len(records) or len({x['id'] for x in records})!=len(records) or not old.keys()<=new.keys():
        raise ValueError('CATALOG_IDENTITY_VIOLATION')
    eligible = set(c['eligible_update_codes'])
    held = {x['code'] for x in c['quarantined_rows'] if x.get('code')}
    if held & eligible: raise ValueError('HELD_CODE_IN_RELEASE')
    for item in records:
        code=item['code']
        if set(item)!=FIELDS or not isinstance(item['id'],int) or item['id']<1:
            raise ValueError('CATALOG_SCHEMA_CHANGED')
        if code in old and item['id']!=old[code]['id']:
            raise ValueError('BASELINE_ID_CHANGED')
        if code not in eligible:
            if code not in old or item!=old[code]: raise ValueError('UNAPPROVED_CODE_CHANGED')
        else:
            if any(not isinstance(item.get(k),str) or not item[k].strip() for k in ('code','name','active','strength','route')):
                raise ValueError('REQUIRED_VALUE_MISSING')
        if not isinstance(item['lots'],list) or not isinstance(item['ids'],list) or item['lotCount']!=len(item['lots']):
            raise ValueError('INVALID_LOT_SCHEMA')
    changes={code for code in new if old.get(code)!=new[code]}
    if changes!={x['code'] for x in c['diff']} or not changes<=eligible:
        raise ValueError('DIFF_DOES_NOT_MATCH_APPROVAL')
    return records

def run(*args):
    subprocess.run(args,cwd=ROOT,check=True)

def request_pages_build():
    req=urllib.request.Request('https://api.github.com/repos/vpmed-tanhung/trang-chu/pages/builds',data=b'{}',headers={
        'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json',
        'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},method='POST')
    try:
        with urllib.request.urlopen(req,timeout=30) as r: return r.status
    except urllib.error.HTTPError as e: return e.code

def main():
    if os.environ.get('GITHUB_REPOSITORY')!='vpmed-tanhung/trang-chu' or os.environ.get('GITHUB_REF')!='refs/heads/main':
        raise SystemExit('REPOSITORY_OR_BRANCH_DENIED')
    job=api('/publisher/claim',{})
    if not job:
        print('No approved catalog waiting.'); return
    common={'job_id':job['job_id'],'lease':job['lease']}
    try:
        records=validate(job,(ROOT/DATA).read_bytes())
        payload=(json.dumps(records,ensure_ascii=False,indent=2)+'\n').encode()
        (ROOT/DATA).write_bytes(payload)
        (ROOT/ASSET).write_text('window.VPMED_INPATIENT_MEDICINES_20260707='+json.dumps(records,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
        run('python','scripts/update_clinical_data_version.py')
        run('python','scripts/update_sha256sums.py')
        run('python','scripts/update_sha256sums.py','--check')
        run('node','--check',ASSET)
        for test in sorted((ROOT/'tests').glob('*.js')): run('node',str(test))
        run('python','-m','pytest','-q')
        run('git','config','user.name','github-actions[bot]')
        run('git','config','user.email','41898282+github-actions[bot]@users.noreply.github.com')
        run('git','add',DATA,ASSET,'assets/app-version.json','sw.js','SHA256SUMS.txt')
        if subprocess.run(['git','diff','--cached','--quiet'],cwd=ROOT).returncode:
            run('git','commit','-m','data: publish pharmacist-approved catalog '+job['job_id'])
            # Reject concurrency instead of rebasing an approved clinical change onto a different baseline.
            run('git','push','origin','HEAD:main')
        commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
        build_status=request_pages_build()
        api('/publisher/result',{**common,'ok':True,'commit':commit,'dataset_sha256':hashlib.sha256(payload).hexdigest(),
             'candidate_sha256':job['candidate_sha256'],'pages_build_http_status':build_status})
        print('Approved catalog committed. Waiting for website hash verification.')
    except Exception as e:
        # Exceptions can contain authorization headers or remote source text: do not print them.
        code=str(e) if isinstance(e,ValueError) and str(e).replace('_','').isalnum() else 'PUBLICATION_CHECK_FAILED'
        api('/publisher/result',{**common,'ok':False,'error_code':code})
        raise SystemExit('Publication stopped: '+code) from None
if __name__=='__main__': main()
