'use strict';

const assert=require('assert');
const catalog=require('../data/icd10_byt2026_min.json').map(item=>item.code);
const ocr=require('../assets/prescription-diagnosis-ocr.js');

const printedPrescription=`
CHẨN ĐOÁN CHÍNH: A01.0 - Chẩn đoán thử nghiệm
CHẨN ĐOÁN KÈM THEO: B18.1; J18.9; K21.0; N18.4; I50.9; D50.8; G20; M17.1
Mô tả chẩn đoán được in trên nhiều dòng nhưng mọi mã vẫn thuộc mục kèm theo.
THUỐC ĐIỀU TRỊ:
1. Thuốc thử nghiệm
`;
const exact=ocr.extractDiagnosisFromText(printedPrescription,catalog);
assert.deepStrictEqual(exact.primary,['A01.0']);
assert.deepStrictEqual(exact.secondary,['B18.1','J18.9','K21.0','N18.4','I50.9','D50.8','G20','M17.1']);

const noisyOcr=`
CHAN DOAN CHINH: A 01.0
CHAN DOAN KEM THEO: B181; J189; K2I.0; N184; I509; D50,8; G20; M17.1
TEN THUOC: A01.0
`;
const recovered=ocr.extractDiagnosisFromText(noisyOcr,catalog);
assert.deepStrictEqual(recovered.primary,['A01.0']);
assert.deepStrictEqual(recovered.secondary,['B18.1','J18.9','K21.0','N18.4','I50.9','D50.8','G20','M17.1']);

const repeated=ocr.extractDiagnosisFromText('Chẩn đoán chính: E11.9\nChẩn đoán kèm theo: E11.9; I10',catalog);
assert.deepStrictEqual(repeated.primary,['E11.9']);
assert.deepStrictEqual(repeated.secondary,['E11.9','I10']);

const structured=ocr.normalizeProvidedDiagnosis({primary:'A01.0; B18.1',secondary:['J18.9; K21.0','N18.4']},catalog);
assert.deepStrictEqual(structured.primary,['A01.0','B18.1']);
assert.deepStrictEqual(structured.secondary,['J18.9','K21.0','N18.4']);

const longSecondary=catalog.filter(code=>/^[A-Z][0-9]{2}(?:\.[0-9]{1,4})?$/.test(code)).slice(120,170);
const longResult=ocr.extractDiagnosisFromText(`Chẩn đoán chính: A01.0\nChẩn đoán kèm theo: ${longSecondary.join('; ')}\nThuốc điều trị:`,catalog);
assert.deepStrictEqual(longResult.primary,['A01.0']);
assert.deepStrictEqual(longResult.secondary,longSecondary);

assert.deepStrictEqual(ocr.extractIcdCodes('ABC.9; ZZZ9; 123456',catalog),[]);
assert.deepStrictEqual(ocr.extractIcdCodes('NOI DUNG CHAN DOAN',catalog),[]);
console.log('Prescription diagnosis OCR tests: OK');
