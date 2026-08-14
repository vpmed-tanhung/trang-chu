const assert=require('assert');
const fs=require('fs');

class FakeElement{
  constructor(tag='div'){
    this.tagName=tag.toUpperCase();
    this.value='';
    this.hidden=false;
    this.textContent='';
    this.listeners={};
    this._innerHTML='';
  }
  set innerHTML(html){
    this._innerHTML=String(html);
    if(this.tagName==='SELECT'){
      const options=[...this._innerHTML.matchAll(/<option\s+value="([^"]*)"([^>]*)>/g)];
      const selected=options.find((match)=>/\bselected\b/.test(match[2]));
      this.value=(selected||options[0]||[])[1]||'';
    }
  }
  get innerHTML(){return this._innerHTML;}
  addEventListener(type,handler){(this.listeners[type]||(this.listeners[type]=[])).push(handler);}
  dispatch(type,event={}){for(const handler of this.listeners[type]||[])handler({key:'',...event});}
}

class FakeRoot extends FakeElement{
  constructor(){super('div');this.nodes={};}
  set innerHTML(html){
    this._innerHTML=String(html);
    this.nodes={};
    for(const match of this._innerHTML.matchAll(/<(input|select|label|button|section|small|div|tbody|th)\b([^>]*\bid="([^"]+)"[^>]*)>/g)){
      const element=new FakeElement(match[1]);
      element.hidden=/\bhidden\b/.test(match[2]);
      if(match[1]==='select'){
        const close=`</select>`;
        const start=match.index+match[0].length;
        const end=this._innerHTML.indexOf(close,start);
        if(end>=0)element.innerHTML=this._innerHTML.slice(start,end);
      }
      this.nodes[match[3]]=element;
    }
  }
  get innerHTML(){return this._innerHTML;}
  querySelector(selector){return selector.startsWith('#')?this.nodes[selector.slice(1)]||null:null;}
}

const root=new FakeRoot();
global.window={};
global.document={getElementById(id){return id==='stockPediatricTool'?root:null;}};
require('../assets/stock_clinical_data_20260814.js');
require('../assets/stock_clinical_tools.js');

const get=(id)=>root.querySelector(`#${id}`);
const change=(id,value,type='input')=>{get(id).value=String(value);get(id).dispatch(type);};
const calculate=()=>get('stockPedCalculate').dispatch('click');

assert.strictEqual(get('stockPedPopulation'),null,'Không được còn trường Nhóm tuổi');
assert.strictEqual(get('stockPedPna'),null,'Không được còn trường PNA nhập tay');
assert.strictEqual(get('stockPedRegimen'),null,'Không được còn bộ chọn phác đồ');
assert.strictEqual(get('stockPedRegimenWrap'),null,'Không được còn khối chọn phác đồ');
assert.doesNotMatch(root.innerHTML,/Chỉ định \/ phác đồ/);
assert.match(root.innerHTML,/dose-layout stock-pediatric-layout/,'Bố cục phải dùng cùng khung với công cụ suy thận');
assert.match(root.innerHTML,/Lịch sử tra cứu dùng chung/,'Phải có lịch sử tra cứu dùng chung');
assert.ok(get('stockPedPatientCode'),'Phải có mã bệnh nhân HIS');
assert.strictEqual(get('stockPedPmaWrap').hidden,true,'PMA phải ẩn trước khi xác định trẻ Sơ sinh');

change('stockPedPatientCode','BN0001');
change('stockPedWeight',10);
change('stockPedAgeValue',3);
assert.match(get('stockPedAgeMode').textContent,/Nhi khoa/);
assert.strictEqual(get('stockPedDrug').value,'amoxicillin-clavulanate');
calculate();
assert.match(get('stockPedResult').innerHTML,/225 mg/);
assert.match(get('stockPedResult').innerHTML,/450 mg/);
assert.match(get('stockPedResult').innerHTML,/Liều nền theo tuổi/);
assert.match(get('stockPedResult').innerHTML,/Lựa chọn đặc biệt/);
assert.match(get('stockPedResult').innerHTML,/Bệnh viện Nhi Trung ương/);
assert.match(get('stockPedResult').innerHTML,/Bệnh cảnh áp dụng/);
assert.match(get('stockPedResult').innerHTML,/Chỉ chuyển sang mức này khi/);
assert.match(get('stockPedResult').innerHTML,/Nguồn tính liều trực tiếp/);
assert.doesNotMatch(get('stockPedResult').innerHTML,/2147\/QĐ-BYT/,'Không được dùng phác đồ viêm phổi người lớn cho công cụ Nhi');
assert.doesNotMatch(get('stockPedResult').innerHTML,/cap-nhat-bo-sung-huong-dan-su-dung-khang-sinh/,'Không được trỏ tới bài giới thiệu hướng dẫn 2024');
assert.doesNotMatch(get('stockPedResult').innerHTML,/tai-lieu-huong-dan-su-dung-khang-sinh/,'Không được dùng trang hồ sơ/tải tài liệu làm nguồn trực tiếp của mức liều');
assert.strictEqual(get('stockPedPmaWrap').hidden,true);

change('stockPedAgeValue',2);
change('stockPedAgeUnit','year','change');
change('stockPedDrug','levofloxacin','change');
calculate();
assert.match(get('stockPedResult').innerHTML,/su-dung-khang-sinh-fluoroquinolon-trong-nhi-khoa/);
assert.doesNotMatch(get('stockPedResult').innerHTML,/fresenius-kabi/,'Trang chỉ nhận diện sản phẩm không được gắn nhãn HDSD trong kết quả Nhi');

change('stockPedDrug','ceftazidime','change');
calculate();
assert.match(get('stockPedResult').innerHTML,/500 mg/);
assert.match(get('stockPedResult').innerHTML,/Mỗi 8 giờ/);

change('stockPedAgeValue',10);
change('stockPedAgeUnit','day','change');
change('stockPedPma',34);
change('stockPedWeight',3);
change('stockPedDrug','ceftazidime','change');
assert.match(get('stockPedAgeMode').textContent,/Sơ sinh/);
assert.strictEqual(get('stockPedPmaWrap').hidden,false);
calculate();
assert.match(get('stockPedResult').innerHTML,/150 mg/);
assert.match(get('stockPedResult').innerHTML,/Mỗi 12 giờ/);
assert.match(get('stockPedResult').innerHTML,/10 ngày sau sinh · PMA 34 tuần/);

change('stockPedDrug','meropenem','change');
calculate();
assert.match(get('stockPedResult').innerHTML,/60 mg/);
assert.match(get('stockPedResult').innerHTML,/120 mg/);
assert.match(get('stockPedResult').innerHTML,/Viêm màng não/);
assert.match(get('stockPedResult').innerHTML,/Không tự suy ra bệnh cảnh/);
assert.match(get('stockPedResult').innerHTML,/meronem-1g-sdk-vn-17831-14/,'Phải giữ nguồn đúng chế phẩm và đúng SĐK');
assert.doesNotMatch(get('stockPedResult').innerHTML,/meronem-iv-vn-17832-14/,'Không hiển thị chế phẩm khác SĐK trong nguồn đúng chế phẩm');

for(const [value,unit,expected] of [[14,'day','Sơ sinh'],[2,'week','Sơ sinh'],[1,'month','Nhi khoa'],[1,'year','Nhi khoa']]){
  change('stockPedPma','');
  change('stockPedAgeValue',value);
  change('stockPedAgeUnit',unit,'change');
  assert.match(get('stockPedAgeMode').textContent,new RegExp(expected));
}

const toolSource=fs.readFileSync(require.resolve('../assets/stock_clinical_tools.js'),'utf8');
const renalAuditSource=fs.readFileSync(require.resolve('../assets/vpmed-renal-audit.js'),'utf8');
assert.match(toolSource,/pediatric_antibiotic_dose/,'Nhật ký phải có loại tra cứu Nhi khoa');
assert.match(toolSource,/\.eq\('module_name',historyModule\)/,'Lịch sử Nhi phải được lọc theo module');
assert.match(renalAuditSource,/item\.module_name!==PEDIATRIC_HISTORY_MODULE/,'Lịch sử suy thận không được trộn dòng Nhi khoa');
assert.doesNotMatch(toolSource,/cap-nhat-bo-sung-huong-dan-su-dung-khang-sinh/,'Không lưu lại nguồn giới thiệu 2024 trong mã công cụ');
assert.doesNotMatch(toolSource,/kcb\.vn\/thu-vien-tai-lieu\/tai-lieu-huong-dan-su-dung-khang-sinh/,'Không lưu trang hồ sơ/tải tài liệu như một nguồn đọc trực tiếp');
for(const match of toolSource.matchAll(/url:'([^']+)'/g)){
  assert.doesNotMatch(match[1],/[?&]utm_source=/,'URL nguồn không được có tham số theo dõi');
  assert.doesNotMatch(match[1],/\.pdf(?:$|[?#])/i,'Nguồn lâm sàng phải mở trang HTML, không tải PDF');
}

console.log('Pediatric smart-age calculator tests passed.');
