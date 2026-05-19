// Multi-select filter widget — wraps native <select multiple> elements
(function(){
  'use strict';
  function init(){
    document.querySelectorAll('.filter-bar select[data-multi="1"]').forEach(function(sel){
      if(sel.dataset.msReady)return;
      sel.dataset.msReady='1';
      var labelOpt = sel.querySelector('option[value=""]');
      var labelText = labelOpt ? labelOpt.textContent : (sel.id||'Filtre');

      var wrap = document.createElement('span');
      wrap.className = 'ms-wrap';
      wrap.dataset.for = sel.id;

      var trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'ms-trigger';
      trigger.innerHTML = '<span class="ms-label">'+labelText+'</span> <span class="ms-arrow">▾</span>';

      var panel = document.createElement('div');
      panel.className = 'ms-panel';

      function rebuild(){
        panel.innerHTML = '';
        Array.from(sel.options).forEach(function(opt){
          if(!opt.value) return;
          var lab = document.createElement('label');
          var chk = document.createElement('input');
          chk.type = 'checkbox';
          chk.value = opt.value;
          chk.checked = opt.selected;
          chk.addEventListener('change', function(){
            opt.selected = chk.checked;
            sel.dispatchEvent(new Event('change',{bubbles:true}));
            updateCount();
          });
          lab.appendChild(chk);
          var span = document.createElement('span');
          span.textContent = opt.textContent;
          lab.appendChild(span);
          panel.appendChild(lab);
        });
      }
      function updateCount(){
        var cnt = Array.from(sel.selectedOptions).filter(function(o){return o.value;}).length;
        var existing = trigger.querySelector('.ms-count');
        if(cnt>0){
          if(!existing){
            var c = document.createElement('span');
            c.className = 'ms-count';
            c.textContent = cnt;
            trigger.insertBefore(c, trigger.querySelector('.ms-arrow'));
          } else { existing.textContent = cnt; }
        } else if(existing){ existing.remove(); }
      }
      trigger.addEventListener('click', function(e){
        e.stopPropagation();
        document.querySelectorAll('.ms-panel.open').forEach(function(p){ if(p!==panel) p.classList.remove('open'); });
        panel.classList.toggle('open');
        if(panel.classList.contains('open')) rebuild();
      });
      wrap.appendChild(trigger);
      wrap.appendChild(panel);
      sel.parentNode.insertBefore(wrap, sel);
      rebuild();
      
      // Listen to programmatic changes (e.g. _reset()) and update count badge
      sel.addEventListener('change', function(){ updateCount(); rebuild(); });
      updateCount();
      // Re-rebuild after options populate (popFilters fires later)
      var obs = new MutationObserver(function(){ rebuild(); updateCount(); });
      obs.observe(sel, {childList:true});
    });
    // Close on outside click
    document.addEventListener('click', function(){
      document.querySelectorAll('.ms-panel.open').forEach(function(p){ p.classList.remove('open'); });
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // Re-init periodically in case options populate after page load
  setTimeout(init, 500);
  setTimeout(init, 1500);
})();
