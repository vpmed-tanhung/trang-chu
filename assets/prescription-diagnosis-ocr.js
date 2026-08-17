/*
 * Bộ tách mã ICD từ văn bản OCR của đơn thuốc in.
 * Chỉ nhận mã chính xác có trong danh mục ICD-10 Bộ Y tế; không gộp hoặc
 * suy rộng mã theo nhóm ba ký tự.
 */
(function exposePrescriptionDiagnosisOcr(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.VPMED_PRESCRIPTION_DIAGNOSIS_OCR=api;
})(typeof window!=='undefined'?window:globalThis,function createPrescriptionDiagnosisOcr(root){
  'use strict';

  const VERSION='2026.08.17-exact-icd-v2';
  const unique=items=>[...new Set((items||[]).filter(Boolean))];
  let cachedCatalogSource=null;
  let cachedCatalog=null;

  function foldOcrText(value){
    return String(value||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/đ/g,'d')
      .replace(/Đ/g,'D')
      .toUpperCase();
  }

  function catalogSet(override){
    const source=Array.isArray(override)?override:(root?.VPMED_ICD10_CODE_INDEX_2026||[]);
    if(!source.length)return null;
    if(source===cachedCatalogSource&&cachedCatalog)return cachedCatalog;
    cachedCatalogSource=source;
    cachedCatalog=new Set(source.map(item=>String(typeof item==='string'?item:item?.code||'').toUpperCase()).filter(Boolean));
    return cachedCatalog;
  }

  function canonicalCandidate(token){
    let compact=String(token||'').toUpperCase().replace(/\s+/g,'').replace(/[,·]/g,'.');
    if(!compact)return '';
    const first=compact[0]==='1'?'I':compact[0];
    let rest=compact.slice(1).replace(/O/g,'0').replace(/[IL]/g,'1');
    compact=first+rest;
    if(!compact.includes('.')&&compact.length>3)compact=`${compact.slice(0,3)}.${compact.slice(3)}`;
    return /^[A-Z][0-9]{2}(?:\.[0-9]{1,4})?$/.test(compact)?compact:'';
  }

  function extractIcdCodes(value,officialCodes){
    const prepared=String(value||'').toUpperCase()
      .replace(/[‐‑‒–—]/g,'-')
      .replace(/\b([A-Z1])\s+([0-9OIL]{2})(?=\s*[.,·]|\s|[,;:()/-]|$)/g,'$1$2')
      .replace(/\b([A-Z1][0-9OIL]{2})\s*[,·]\s*([0-9OIL]{1,4})\b/g,'$1.$2')
      .replace(/\s*\.\s*/g,'.')
      .replace(/([0-9OIL])(?=[A-Z1][0-9OIL]{2}(?:\.|\b))/g,'$1 ');
    const candidates=prepared.match(/\b[A-Z1][0-9OIL]{2}(?:\s*\.?\s*[0-9OIL]{1,4})?\b/g)||[];
    const official=catalogSet(officialCodes);
    return unique(candidates
      .filter(token=>/[0-9]/.test(token))
      .map(canonicalCandidate)
      .filter(code=>code&&(!official||official.has(code))));
  }

  function diagnosisCodesOf(value,officialCodes){
    if(typeof value==='string')return extractIcdCodes(value,officialCodes);
    if(value&&typeof value==='object')return extractIcdCodes(value.code||value.icd||value.ma_benh||value.value||'',officialCodes);
    return [];
  }

  function normalizeProvidedDiagnosis(raw,officialCodes){
    if(!raw||typeof raw!=='object')return {primary:[],secondary:[]};
    const primaryRaw=raw.primary||raw.main||raw.ma_benh_chinh||raw.primaryDiagnosis||[];
    const secondaryRaw=raw.secondary||raw.additional||raw.ma_benh_kem_theo||raw.secondaryDiagnoses||[];
    const primary=unique((Array.isArray(primaryRaw)?primaryRaw:[primaryRaw]).flatMap(value=>diagnosisCodesOf(value,officialCodes)));
    const secondary=unique((Array.isArray(secondaryRaw)?secondaryRaw:[secondaryRaw]).flatMap(value=>diagnosisCodesOf(value,officialCodes)));
    return {primary,secondary};
  }

  function extractDiagnosisFromText(text,officialCodes){
    const folded=foldOcrText(text);
    const markers=[];
    const gap='[\\s_.:/-]*';
    const addMarkers=(pattern,type)=>{
      for(const match of folded.matchAll(pattern))markers.push({type,index:match.index,end:match.index+match[0].length});
    };
    addMarkers(new RegExp(`(?:MA${gap}BENH${gap}CHINH|CHAN${gap}D[O0Q]AN${gap}CHINH|BENH${gap}CHINH|CD${gap}CHINH)${gap}`,'g'),'primary');
    addMarkers(new RegExp(`(?:MA${gap}BENH${gap}(?:KEM${gap}THEO|KEM|KT|PHU)|CHAN${gap}D[O0Q]AN${gap}(?:KEM${gap}THEO|KEM|PHU)|BENH${gap}(?:KEM${gap}THEO|KEM|PHU)|CD${gap}(?:KEM|PHU))${gap}`,'g'),'secondary');
    addMarkers(new RegExp(`(?:CHAN${gap}D[O0Q]AN|MA${gap}BENH)(?!${gap}(?:CHINH|KEM|KT|PHU))${gap}`,'g'),'generic');
    markers.sort((a,b)=>a.index-b.index||b.end-a.end);
    const deduped=markers.filter((marker,index)=>!markers.slice(0,index).some(previous=>marker.index>=previous.index&&marker.end<=previous.end));
    const result={primary:[],secondary:[]};
    const stopPattern=/\b(?:TEN\s*THUOC|DANH\s*SACH\s*THUOC|THUOC\s*DIEU\s*TRI|LIEU\s*DUNG|CACH\s*DUNG|LOI\s*DAN|DON\s*THUOC|BAC\s*SI|NGUOI\s*KE\s*DON|HO\s*TEN|MA\s*NGUOI\s*BENH|SO\s*THE|DIA\s*CHI|NGAY\s*SINH|GIOI\s*TINH)\b/;
    deduped.forEach((marker,index)=>{
      const next=deduped[index+1];
      let segment=folded.slice(marker.end,next?next.index:folded.length);
      const stop=segment.search(stopPattern);
      if(stop>=0)segment=segment.slice(0,stop);
      const codes=extractIcdCodes(segment,officialCodes);
      if(marker.type==='primary')result.primary.push(...codes);
      else if(marker.type==='secondary')result.secondary.push(...codes);
      else if(codes.length){result.primary.push(codes[0]);result.secondary.push(...codes.slice(1));}
    });
    result.primary=unique(result.primary);
    result.secondary=unique(result.secondary);
    return result;
  }

  return Object.freeze({VERSION,foldOcrText,extractIcdCodes,normalizeProvidedDiagnosis,extractDiagnosisFromText});
});
