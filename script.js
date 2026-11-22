(function(){
  var WA='https://wa.me/2348087674813?text=';
  function wa(msg){return WA+encodeURIComponent(msg)}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

  /* ---- Content: edit here ---- */
  var fabrics=[
    {n:'Mr. Fendi',p:'₦4,500',u:'yard',c:'Fabrics'},
    {n:'Phanta Plus',p:'₦5,500',u:'yard',c:'Fabrics'},
    {n:'Supreme Longhua',p:'₦3,700',u:'yard',c:'Fabrics'},
    {n:'Wagambari',p:'₦30,000',u:'5-yard set',d:'Traditional men\'s fabric, supplied as a 5-yard set.',c:'Shadda'},
    {n:'Excelsior',p:'₦3,800',u:'yard',c:'Fabrics'},
    {n:'Goods Will',p:'₦3,800',u:'yard',c:'Fabrics'},
    {n:'Casacada by Mhood',p:'₦4,500',u:'yard',c:'Fabrics'},
    {n:'Oliva',p:'₦4,000',u:'yard',c:'Fabrics'},
    {n:'Trevita',p:'₦4,000',u:'yard',c:'Fabrics'},
    {n:'Turkish Wool',p:'₦11,500',u:'yard',d:'Wool fabric for refined tailoring.',c:'Fabrics'},
    {n:'Yak Wool',p:'₦13,500',u:'yard',d:'Wool fabric from our premium range.',c:'Fabrics'},
    {n:'VIP Ultimate',p:'₦7,000',u:'yard',d:'A premium selection for distinguished dressing.',c:'Fabrics'}
  ];
  /* Caps: add a price (e.g. p:'₦0,000') only once it is confirmed */
  var caps=[
    {n:'Zeeta',c:'Men\'s Caps'},{n:'Eleganza',c:'Men\'s Caps'},{n:'Dara',c:'Men\'s Caps'},
    {n:'Zanna',c:'Men\'s Caps'},{n:'Tangaran',c:'Men\'s Caps'},{n:'Kindai Miyamar Borno',c:'Men\'s Caps'}
  ];
  /* New arrivals: leave empty until you confirm what is new.
     Example: {n:'Oliva',tag:'Just in',p:'₦4,000',u:'yard',c:'Premium Fabrics'} — tag: 'New arrival' | 'Just in' | 'Limited stock' */
  var arrivals=[];

  var pats=['twill','stripe','rib','basket','herring','dot'];
  var registry={},uid=0;

  function makeCard(item){
    var id='p'+(uid++);
    registry[id]=item;
    var pat=pats[uid%pats.length];
    var price=item.p
      ? '<span class="price">'+esc(item.p)+'</span>'+(item.u?'<span class="unit"> / '+esc(item.u)+'</span>':'')
      : '<span class="ask">Price on request</span>';
    var msg='Hello HOF, I am interested in '+item.n+'. Please send me more details and availability.';
    return '<div class="pc rv" style="--d:'+((uid%8)*35)+'ms">'
      +'<button type="button" class="pc-trigger" data-id="'+id+'" aria-label="View details: '+esc(item.n)+'">'
      +'<span class="sw"><svg aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill="url(#p-'+pat+')"/></svg></span>'
      +'<span class="pc-body"><span class="pc-name">'+esc(item.n)+'</span>'
      +(item.d?'<span class="pc-desc">'+esc(item.d)+'</span>':'')
      +price
      +'<span class="avail">'+(item.tag?esc(item.tag):'Confirm availability on WhatsApp')+'</span></span>'
      +'</button>'
      +'<a class="order" href="'+wa(msg)+'" target="_blank" rel="noopener noreferrer" aria-label="Order on WhatsApp: '+esc(item.n)+'">Order on WhatsApp</a>'
      +'</div>';
  }
  function fillGrid(id,list){
    var el=document.getElementById(id);
    if(el)el.innerHTML=list.map(makeCard).join('');
  }
  fillGrid('capGrid',caps);
  fillGrid('arrivalGrid',arrivals);

  /* ---- Fabric catalogue: search + category filter ---- */
  var cats=['All','Fabrics','Shadda','Lace','Voil','Atiku','Swiss'];
  var chipsEl=document.getElementById('fabricChips');
  if(chipsEl){
    chipsEl.innerHTML=cats.map(function(c,i){
      return '<button type="button" class="chip" data-cat="'+esc(c)+'" aria-pressed="'+(i===0?'true':'false')+'">'+esc(c)+'</button>';
    }).join('');
  }
  var activeCat='All',query='';
  function renderFabrics(){
    var list=fabrics.filter(function(f){
      var matchCat=activeCat==='All'||(activeCat==='Shadda'&&['Shadda','Getzner','Wagambari'].indexOf(f.c)>-1)||f.c===activeCat;
      var hay=(f.n+' '+(f.d||'')+' '+f.c).toLowerCase();
      var matchQuery=!query||hay.indexOf(query)>-1;
      return matchCat&&matchQuery;
    });
    var grid=document.getElementById('fabricGrid'),empty=document.getElementById('fabricEmpty');
    if(grid)grid.innerHTML=list.map(makeCard).join('');
    if(empty)empty.hidden=list.length>0;
  }
  renderFabrics();
  if(chipsEl)chipsEl.addEventListener('click',function(e){
    var b=e.target.closest('.chip');
    if(!b)return;
    chipsEl.querySelectorAll('.chip').forEach(function(c){c.setAttribute('aria-pressed','false')});
    b.setAttribute('aria-pressed','true');
    activeCat=b.getAttribute('data-cat');
    renderFabrics();
  });
  var searchInput=document.getElementById('fabricSearch');
  if(searchInput)searchInput.addEventListener('input',function(){
    query=searchInput.value.trim().toLowerCase();
    renderFabrics();
  });

  /* ---- Shop by category (editorial index) ---- */
  var catMaster=[
    {label:'Fabrics',key:'Fabrics',target:'fabrics'},
    {label:'Shadda',key:'Shadda',target:'fabrics'},
    {label:'Men Lace',key:'Lace',target:'fabrics'},
    {label:'Caps',key:'Men\'s Caps',target:'caps'},
    {label:'Shoes',key:'Shoes',target:'shoes'}
  ];
  var sbcEl=document.getElementById('sbcIndex');
  if(sbcEl){
    sbcEl.innerHTML=catMaster.map(function(cat){
      var count=cat.target==='caps'?caps.length:fabrics.filter(function(f){return cat.key==='Shadda'?['Shadda','Getzner','Wagambari'].indexOf(f.c)>-1:f.c===cat.key}).length;
      var countLabel=count>0?(count+(count===1?' piece':' pieces')):(cat.target==='shoes'?'Enquire on WhatsApp':'Ask on WhatsApp');
      return '<button type="button" class="sbc-row" data-key="'+esc(cat.key)+'" data-target="'+cat.target+'">'
        +'<span class="sbc-name">'+esc(cat.label)+'</span>'
        +'<span class="sbc-meta"><span class="sbc-count">'+esc(countLabel)+'</span><span class="sbc-arrow" aria-hidden="true">&rarr;</span></span>'
        +'</button>';
    }).join('');
    sbcEl.addEventListener('click',function(e){
      var row=e.target.closest('.sbc-row');
      if(!row)return;
      var key=row.getAttribute('data-key'),target=row.getAttribute('data-target');
      if(target==='caps'){
        document.getElementById('caps').scrollIntoView({behavior:'smooth',block:'start'});
        return;
      }
      if(target==='shoes'){
        window.open(wa('Hello HOF, please let me know about your shoes collection.'),'_blank','noopener');
        return;
      }
      activeCat=key;
      query='';
      if(searchInput)searchInput.value='';
      renderFabrics();
      if(chipsEl)chipsEl.querySelectorAll('.chip').forEach(function(c){
        c.setAttribute('aria-pressed',c.getAttribute('data-cat')===key?'true':'false');
      });
      document.getElementById('fabrics').scrollIntoView({behavior:'smooth',block:'start'});
    });
  }

  /* ---- Product detail view ---- */
  var backdrop=document.getElementById('modalBackdrop'),lastFocus=null;
  function openModal(item){
    if(!item)return;
    lastFocus=document.activeElement;
    document.getElementById('modalTitle').textContent=item.n;
    document.getElementById('modalPrice').innerHTML=item.p
      ? '<span class="price">'+esc(item.p)+'</span>'+(item.u?'<span class="unit">/ '+esc(item.u)+'</span>':'')
      : '<span class="ask" style="font:italic 500 1.1rem/1 var(--display)">Price on request</span>';
    document.getElementById('modalDesc').textContent=item.d||'Premium selection from HOF — Home of Fabric.';
    document.getElementById('modalAvail').textContent=(item.u?'Unit: '+item.u+'   ·   ':'')+'Availability confirmed on WhatsApp';
    var pat=pats[Math.floor(Math.random()*pats.length)];
    document.getElementById('modalSwatch').innerHTML='<svg aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill="url(#p-'+pat+')"/></svg><button type="button" class="modal-close" id="modalClose" aria-label="Close">&times;</button>';
    var msg='Hello HOF, I am interested in '+item.n+'. Please send me more details and availability.';
    document.getElementById('modalOrder').href=wa(msg);
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    document.getElementById('modalClose').focus();
  }
  function closeModal(){
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    if(lastFocus&&lastFocus.focus)lastFocus.focus();
  }
  document.addEventListener('click',function(e){
    var trig=e.target.closest('.pc-trigger');
    if(trig){openModal(registry[trig.getAttribute('data-id')]);return}
    if(e.target===backdrop||e.target.closest('#modalClose'))closeModal();
  });
  document.addEventListener('keydown',function(e){
    if(!backdrop.classList.contains('open'))return;
    if(e.key==='Escape'){closeModal();return}
    if(e.key==='Tab'){
      var focusable=backdrop.querySelectorAll('button,a[href]');
      if(!focusable.length)return;
      var first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    }
  });

  /* ---- Mobile menu ---- */
  var burger=document.querySelector('.burger'),nav=document.getElementById('menu');
  var mainEl=document.getElementById('main'),footerEl=document.querySelector('.footer');
  function setMenu(open){
    nav.classList.toggle('open',open);
    burger.setAttribute('aria-expanded',open);
    burger.setAttribute('aria-label',open?'Close menu':'Open menu');
    document.body.style.overflow=open?'hidden':'';
    [mainEl,footerEl].forEach(function(el){
      if(!el)return;
      if(open)el.setAttribute('inert','');else el.removeAttribute('inert');
    });
  }
  burger.addEventListener('click',function(){setMenu(!nav.classList.contains('open'))});
  nav.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)});
  window.matchMedia('(min-width:960px)').addEventListener('change',function(){setMenu(false)});

  /* ---- Scroll reveal ---- */
  var items=document.querySelectorAll('.rv');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
    },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    items.forEach(function(el){io.observe(el)});
  }else{items.forEach(function(el){el.classList.add('in')})}

  /* ---- Floating WhatsApp button ---- */
  var fab=document.getElementById('fab'),ticking=false;
  function onScroll(){
    ticking=false;
    fab.classList.toggle('show',window.scrollY>window.innerHeight*.8);
  }
  window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
  onScroll();
})();
