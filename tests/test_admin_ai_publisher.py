import copy, hashlib, importlib.util, json
from pathlib import Path
import pytest
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('admin_publisher',ROOT/'scripts/admin_ai_publish.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def item(code,id=1):
    x={k:'' for k in m.FIELDS};x.update(code=code,id=id,name='Thuốc đã xác minh',active='Hoạt chất nguồn',strength='500 mg',route='Uống',ids=['001'],lots=[{'idThuoc':'001'}],lotCount=1);return x

def job():
    old=item('A');new={**old,'pack':'Hộp 10 viên'};raw=json.dumps([old]).encode()
    c={'import_scope':'partial_overlay','blockers':[],'clinical_review_required':True,'records':[new],
       'eligible_update_codes':['A'],'quarantined_rows':[],'diff':[{'code':'A'}]}
    return {'reviewed_at':'2026-11-16T00:00:00Z','candidate_sha256':'a'*64,'base_sha256':hashlib.sha256(raw).hexdigest(),'candidate':c},raw

def test_approved_exact_diff():
    j,raw=job();assert m.validate(j,raw)[0]['pack']=='Hộp 10 viên'

@pytest.mark.parametrize('mutation',[
    lambda j:j.pop('reviewed_at'),
    lambda j:j.update(base_sha256='0'*64),
    lambda j:j['candidate'].update(import_scope='replace_all'),
    lambda j:j['candidate'].update(quarantined_rows=[{'code':'A'}]),
    lambda j:j['candidate']['records'][0].update(id=99),
    lambda j:j['candidate']['records'][0].update(active=''),
    lambda j:j['candidate'].update(eligible_update_codes=[]),
    lambda j:j['candidate'].update(diff=[]),
    lambda j:j['candidate'].update(records=[]),
])
def test_refuses_unapproved_or_tampered_data(mutation):
    j,raw=job();mutation(j)
    with pytest.raises(ValueError):m.validate(j,raw)
