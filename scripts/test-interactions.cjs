const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../dist/app.js'), 'utf8');
function boot(withForm = true, query = '') {
  const registered = [], opened = [], elements = {};
  class Element {
    constructor() { this.listeners = {}; this.attrs = {}; this.value = ''; this.hidden = false; this.children = []; this.classList = { values: new Set(), toggle: (v, on) => on ? this.classList.values.add(v) : this.classList.values.delete(v), add: v => this.classList.values.add(v) }; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    setAttribute(k,v) { this.attrs[k] = v; }
    getAttribute(k) { return this.attrs[k]; }
    querySelectorAll() { return []; }
    querySelector(s) { return this.children.find(x => x.className === s.slice(1)); }
    closest() { return this.parent ||= new Element(); }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    focus() { this.focused = true; }
    scrollIntoView() { this.scrolled = true; }
    reportValidity() { return true; }
  }
  for(const s of ['#year','.menu-toggle','#main-nav','header','#quote']) elements[s] = new Element();
  const fields = Object.fromEntries(['name','phone','service','destination','city','cargo'].map(k => [k,new Element()]));
  fields.service.value = 'Sea shipping';fields.destination.value = 'Lagos';
  let form;
  if(withForm){ form=elements['#quote-form']=new Element();form.elements={namedItem:k=>fields[k]}; }
  const document = { querySelector: s=>elements[s]||null, querySelectorAll:()=>[], addEventListener(){}, createElement:()=>new Element(), createTextNode:t=>({textContent:t}), modelContext:{registerTool:t=>registered.push(t)} };
  const window = { matchMedia:()=>({matches:false,addEventListener(){}}), addEventListener(){}, scrollY:0, location:{search:query}, open:u=>opened.push(u) };
  class FormData { get(k) { return fields[k]?.disabled ? null : fields[k]?.value; } }
  vm.runInNewContext(source,{document,window,URLSearchParams,FormData,Date,Promise,AbortController,navigator:{}});
  return { registered,opened,fields,form,elements };
}
assert.equal(boot(false).registered.length,0,'Inner pages without a form must initialize safely');
const app=boot(true,'?service=air');
assert.equal(app.fields.service.value,'Air freight','Air freight CTA should preselect the method');
assert.equal(app.fields.city.disabled,true);
app.fields.destination.value='Other Nigerian city';app.fields.destination.listeners.change();
assert.equal(app.fields.city.required,true);assert.equal(app.fields.city.closest().hidden,false);
const valid={name:'Test customer',phone:'+234 000 000 0000',service:'Air freight',destination:'Other Nigerian city',city:'Abuja',cargo:'3 cartons, 20 kg. Batteries: none.'};
assert.equal(app.registered[0].execute(valid).status,'prepared');
assert.equal(app.fields.city.value,'Abuja');
assert.throws(()=>app.registered[0].execute({...valid,service:'unknown'}));
assert.equal(app.fields.service.value,'Air freight','Invalid input must leave state intact');
assert.throws(()=>app.registered[0].execute({...valid,city:''}));
app.form.listeners.submit({preventDefault(){}});
assert.equal(app.opened.length,1);
assert(app.opened[0].startsWith('https://wa.me/2348060227854?text='));
assert(decodeURIComponent(app.opened[0]).includes('Destination: Abuja'));
assert(decodeURIComponent(app.opened[0]).includes('3 cartons, 20 kg. Batteries: none.'));
assert.equal(app.form.querySelector('.form-status').hidden,false,'Fallback link should be visible');
app.elements['.menu-toggle'].listeners.click();
assert.equal(app.elements['.menu-toggle'].getAttribute('aria-expanded'),'true');
app.elements['.menu-toggle'].listeners.click();
assert.equal(app.elements['.menu-toggle'].getAttribute('aria-expanded'),'false');
assert.equal(boot(true,'?service=sea').fields.service.value,'Sea shipping');
console.log('PASS: non-form pages, quote preselection, other-city field, safe staging, validation, WhatsApp message, fallback, and menu state.');
