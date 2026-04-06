(function(){
'use strict';

// ── Anti-scraping: disable easy data extraction from console ──
(function(){
    // Prevent JSON.stringify on cheese data from console
    var _origStringify=JSON.stringify;
    JSON.stringify=function(v){
        if(v&&v.cheeses&&v.cheeses.length>50){
            console.warn('⚠️ Les données de ce site sont protégées par le droit d\'auteur.');
            return '{"error":"protected"}';
        }
        return _origStringify.apply(JSON,arguments);
    };
    // Disable right-click context menu on data elements
    document.addEventListener('contextmenu',function(e){
        if(e.target.closest&&e.target.closest('.detail,.ccard,.dbody'))e.preventDefault();
    });
    // Detect DevTools via debugger timing (soft detection)
    var _dtWarn=false;
    setInterval(function(){
        var t0=performance.now();
        (function(){}).constructor('debugger')();
        if(performance.now()-t0>100&&!_dtWarn){
            _dtWarn=true;
            console.log('%c⚠️ Données protégées — © Les Fromages du Bonheur','color:#8B6F47;font-size:16px;font-weight:bold;');
            console.log('%cToute reproduction ou extraction non autorisée est interdite.','color:#999;font-size:12px;');
        }
    },3000);
})();

var ZT=9;
var PAGE_SIZE=50;

// ── GA4 Custom Event Tracking ──
function track(ev,params){
    try{if(typeof gtag==='function')gtag('event',ev,params||{});}catch(e){}
}
// Haversine distance (km) for itinerary
function _haversine(lat1,lon1,lat2,lon2){
    var R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
    var a=Math.sin(dLat/2)*Math.sin(dLat/2)+
        Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*
        Math.sin(dLon/2)*Math.sin(dLon/2);
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function N(s){return s?s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''):'';}
function cheeseSlug(name){
    return name?name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        .replace(/['']/g,'-').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''):'';
}
// Cache of verified image URLs (true=url, false=not found)
var _imgCache={};
var _isLocal=(location.protocol==='file:'||location.hostname==='localhost'||location.hostname==='127.0.0.1');
var _imgBase=_isLocal?'https://lesfromagesdubonheur.com/site/img/':'site/img/';
function cheeseImgUrl(name){return _imgBase+cheeseSlug(name)+'.jpg';}
// Build capitalized slug: first letter uppercase of each segment (e.g. "comte" -> "Comte", "bleu-de-gex" -> "Bleu-de-gex")
function _capSlug(name){
    var s=cheeseSlug(name);
    return s?s.charAt(0).toUpperCase()+s.slice(1):'';
}
// Try multiple image URL variants (case + extension); calls cb(url) on success or cb(null) on failure
function loadCheeseImg(name,cb){
    var slug=cheeseSlug(name);if(!slug){cb(null);return;}
    if(_imgCache[slug]){cb(_imgCache[slug]);return;}
    if(_imgCache[slug]===false){cb(null);return;}
    var cap=_capSlug(name);
    var candidates=[_imgBase+slug+'.jpg',_imgBase+cap+'.jpg',_imgBase+slug+'.jpeg',_imgBase+cap+'.jpeg'];
    var idx=0;
    function tryNext(){
        if(idx>=candidates.length){_imgCache[slug]=false;cb(null);return;}
        var url=candidates[idx++];
        var img=new Image();
        img.onload=function(){_imgCache[slug]=url;cb(url);};
        img.onerror=tryNext;
        img.src=url;
    }
    tryNext();
}
function isMonastic(c){
    if(!c.fm||c.fm==='-'||c.fm==='')return false;
    var t=c.fm.toLowerCase();
    return t.indexOf('moine')>-1||t.indexOf('monast')>-1||t.indexOf('abbay')>-1||
           t.indexOf('soeur')>-1||t.indexOf('trapp')>-1||t.indexOf('religieu')>-1||
           t.indexOf('père')>-1||t.indexOf('cistercien')>-1;
}
function hasBio(c){return c.pr&&c.pr.some(function(p){return p.b;});}
function hasEponyme(c){return c.ep&&Array.isArray(c.ep)&&c.ep.length>0;}
function isMobile(){return window.innerWidth<=768;}

// ── FAVORITES (localStorage) ──
var FAV_KEY='lfdb_favs';
function getFavs(){try{return JSON.parse(localStorage.getItem(FAV_KEY))||[];}catch(e){return [];}}
function saveFavs(arr){try{localStorage.setItem(FAV_KEY,JSON.stringify(arr));}catch(e){}}
function isFav(name){return getFavs().indexOf(name)>=0;}
function toggleFav(name){
    var f=getFavs();var idx=f.indexOf(name);
    if(idx>=0){f.splice(idx,1);}else{f.push(name);}
    saveFavs(f);
    updateFavBadge();
    return idx<0; // returns true if added
}
function updateFavBadge(){
    var count=getFavs().length;
    var badge=document.getElementById('tabFavBadge');
    if(badge){badge.textContent=count;badge.classList.toggle('has-items',count>0);}
    var nc=document.getElementById('navFavCount');if(nc)nc.textContent=count;
}

// Cheese emoji icon
var CHEESE_EMOJI='&#x1F9C0;';
var HOUSE_SVG='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
var FLAG_SVG='<svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>';

var S={
    data:null,map:null,cluster:null,markers:[],focus:null,
    filtered:[],itin:[],depts:null,currentView:'map',
    zoneL:null,localL:null,focusL:null,routeL:null,
    zoneOn:false,pateNames:{},userLoc:null,geoMarker:null,
    communeCache:{},communeLoading:{},
    gridPage:0,filtersOpen:true,showFavs:false
};

// ── PERFORMANCE: localStorage cache helpers ──
var LS_PREFIX='lfb_';
var LS_TTL=7*24*60*60*1000; // 7 days
function lsGet(key){
    try{var raw=localStorage.getItem(LS_PREFIX+key);if(!raw)return null;var o=JSON.parse(raw);if(Date.now()-o.t>LS_TTL){localStorage.removeItem(LS_PREFIX+key);return null;}return o.d;}catch(e){return null;}
}
function lsSet(key,data){
    try{localStorage.setItem(LS_PREFIX+key,JSON.stringify({t:Date.now(),d:data}));}catch(e){/* quota exceeded — silent */}
}

// ── ITINERARY PERSISTENCE ──
function _saveItin(){
    try{
        var serialized=S.itin.map(function(s){
            return {cn:s.cn,pr:{n:s.pr.n,la:s.pr.la,lo:s.pr.lo,b:s.pr.b||false},isGeo:!!s.isGeo};
        });
        localStorage.setItem(LS_PREFIX+'itin',JSON.stringify(serialized));
    }catch(e){/* silent */}
}
function _loadItin(){
    try{
        var raw=localStorage.getItem(LS_PREFIX+'itin');
        if(!raw)return;
        var arr=JSON.parse(raw);
        if(!Array.isArray(arr)||arr.length===0)return;
        S.itin=arr;
    }catch(e){/* silent */}
}

// ── COMMUNE GEOMETRY LOADER (with localStorage cache) ──
function fetchCommunes(deptCode,cb){
    if(S.communeCache[deptCode])return cb(S.communeCache[deptCode]);
    // Try localStorage first
    var cached=lsGet('c_'+deptCode);
    if(cached){S.communeCache[deptCode]=cached;return cb(cached);}
    if(S.communeLoading[deptCode]){
        S.communeLoading[deptCode].push(cb);return;
    }
    S.communeLoading[deptCode]=[cb];
    var url='https://geo.api.gouv.fr/departements/'+deptCode+'/communes?format=geojson&geometry=contour';
    fetch(url).then(function(r){return r.json();}).then(function(geo){
        var idx={};
        if(geo&&geo.features)geo.features.forEach(function(f){idx[f.properties.code]=f;});
        S.communeCache[deptCode]=idx;
        lsSet('c_'+deptCode,idx);
        var cbs=S.communeLoading[deptCode]||[];
        delete S.communeLoading[deptCode];
        cbs.forEach(function(fn){fn(idx);});
    }).catch(function(){
        S.communeCache[deptCode]={};
        var cbs=S.communeLoading[deptCode]||[];
        delete S.communeLoading[deptCode];
        cbs.forEach(function(fn){fn({});});
    });
}

function setTopPadding(){
    var h=document.getElementById('topBar').offsetHeight;
    document.getElementById('app').style.paddingTop=h+'px';
}

// ── FILTER TOGGLE ──
function initFilterToggle(){
    var btn=document.getElementById('filterToggle');
    var bar=document.getElementById('filterBar');
    var arrow=document.getElementById('filterArrow');
    btn.addEventListener('click',function(){
        if(isMobile()){
            openFilterSheet();
        }else{
            S.filtersOpen=!S.filtersOpen;
            bar.classList.toggle('collapsed',!S.filtersOpen);
            arrow.classList.toggle('up',S.filtersOpen);
            setTimeout(function(){setTopPadding();if(S.map)S.map.invalidateSize();},350);
        }
    });
}

// ── MOBILE FILTER SHEET ──
function openFilterSheet(){
    // Sync desktop→mobile
    document.getElementById('fAnimalM').value=document.getElementById('fAnimal').value;
    document.getElementById('fLabelM').value=document.getElementById('fLabel').value;
    document.getElementById('fRegionM').value=document.getElementById('fRegion').value;
    document.getElementById('fPateM').value=document.getElementById('fPate').value;
    document.getElementById('fSaisonM').value=document.getElementById('fSaison').value;
    document.getElementById('fGoutM').value=document.getElementById('fGout').value;
    document.getElementById('fBioM').checked=document.getElementById('fBio').checked;
    document.getElementById('pillBioM').classList.toggle('active',document.getElementById('fBio').checked);
    document.getElementById('fMonasticM').checked=document.getElementById('fMonastic').checked;
    document.getElementById('fEponymeM').checked=document.getElementById('fEponyme').checked;
    document.getElementById('pillMonasticM').classList.toggle('active',document.getElementById('fMonastic').checked);
    document.getElementById('pillEponymeM').classList.toggle('active',document.getElementById('fEponyme').checked);

    var sheet=document.getElementById('filterSheet');
    var overlay=document.getElementById('fsOverlay');
    sheet.style.display='flex';
    overlay.classList.add('active');
    requestAnimationFrame(function(){sheet.classList.add('open');});
}
window._closeFilterSheet=function(){
    var sheet=document.getElementById('filterSheet');
    var overlay=document.getElementById('fsOverlay');
    sheet.classList.remove('open');
    overlay.classList.remove('active');
    setTimeout(function(){sheet.style.display='none';},300);
};
function syncMobileToDesktop(){
    document.getElementById('fAnimal').value=document.getElementById('fAnimalM').value;
    document.getElementById('fLabel').value=document.getElementById('fLabelM').value;
    document.getElementById('fRegion').value=document.getElementById('fRegionM').value;
    document.getElementById('fPate').value=document.getElementById('fPateM').value;
    document.getElementById('fSaison').value=document.getElementById('fSaisonM').value;
    document.getElementById('fGout').value=document.getElementById('fGoutM').value;
    document.getElementById('fBio').checked=document.getElementById('fBioM').checked;
    document.getElementById('fMonastic').checked=document.getElementById('fMonasticM').checked;
    document.getElementById('fEponyme').checked=document.getElementById('fEponymeM').checked;
    applyF();
}
window._applyMobileFilters=function(){
    syncMobileToDesktop();
    window._closeFilterSheet();
};
window._resetFilters=function(){
    document.getElementById('fAnimalM').value='';
    document.getElementById('fLabelM').value='';
    document.getElementById('fRegionM').value='';
    document.getElementById('fPateM').value='';
    document.getElementById('fSaisonM').value='';
    document.getElementById('fGoutM').value='';
    document.getElementById('fBioM').checked=false;
    document.getElementById('fMonasticM').checked=false;
    document.getElementById('fEponymeM').checked=false;
    document.getElementById('pillBioM').classList.remove('active');
    document.getElementById('pillMonasticM').classList.remove('active');
    document.getElementById('pillEponymeM').classList.remove('active');
};
document.getElementById('fsOverlay').addEventListener('click',function(){window._closeFilterSheet();});
document.getElementById('fBioM').addEventListener('change',function(){
    document.getElementById('pillBioM').classList.toggle('active',this.checked);
    syncMobileToDesktop();
});
document.getElementById('fMonasticM').addEventListener('change',function(){
    document.getElementById('pillMonasticM').classList.toggle('active',this.checked);
    syncMobileToDesktop();
});
document.getElementById('fEponymeM').addEventListener('change',function(){
    document.getElementById('pillEponymeM').classList.toggle('active',this.checked);
    syncMobileToDesktop();
});
['fAnimalM','fLabelM','fRegionM','fPateM','fSaisonM','fGoutM'].forEach(function(id){
    document.getElementById(id).addEventListener('change',function(){syncMobileToDesktop();});
});

function initMap(){
    setTopPadding();
    window.addEventListener('resize',function(){setTopPadding();S.map.invalidateSize();});

    S.map=L.map('map',{zoomControl:false}).setView([46.5,2.5],6);
    L.control.zoom({position:'topleft',zoomInTitle:'Zoomer',zoomOutTitle:'Dézoomer'}).addTo(S.map);
    var retina=L.Browser.retina?'@2x':'';
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}'+retina+'.png',{
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains:'abcd',maxZoom:19,tileSize:256,zoomOffset:0,
        errorTileUrl:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRUEFTkSuQmCC'
    }).addTo(S.map);
    S.map.createPane('labels');
    S.map.getPane('labels').style.zIndex=350;
    S.map.getPane('labels').style.pointerEvents='none';
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}'+retina+'.png',{
        subdomains:'abcd',maxZoom:19,tileSize:256,zoomOffset:0,pane:'labels'
    }).addTo(S.map);

    S.zoneL=L.layerGroup().addTo(S.map);
    S.localL=L.layerGroup().addTo(S.map);
    S.focusL=L.layerGroup().addTo(S.map);
    S.routeL=L.layerGroup().addTo(S.map);

    // Panel zoom: defined here so S.map is guaranteed to exist
    window._panelZoom=function(dir){
        S.map.setZoom(S.map.getZoom()+(dir>0?1:-1));
    };

    S.cluster=L.markerClusterGroup({
        maxClusterRadius:50,spiderfyOnMaxZoom:false,zoomToBoundsOnClick:false,
        iconCreateFunction:function(cl){
            var n=cl.getChildCount(),sz=n>50?46:n>20?40:34;
            return L.divIcon({
                html:'<div style="display:flex;flex-direction:column;align-items:center;"><div class="cluster-icon" style="width:'+sz+'px;height:'+sz+'px;font-size:'+(sz>40?13:11)+'px;">'+n+'</div><span style="color:#8B6F47;font-size:9px;font-weight:600;font-family:Inter,sans-serif;margin-top:2px;text-shadow:0 0 3px #fff,0 0 3px #fff;">fromages</span></div>',
                iconSize:[sz,sz+16],iconAnchor:[sz/2,(sz+16)/2],className:''
            });
        }
    }).addTo(S.map);


    // Cluster click: always check for colocated cheeses first
    S.cluster.on('clusterclick',function(e){
        var children=e.layer.getAllChildMarkers();
        if(!children||children.length<1)return;
        // Group all children by coordinates
        var groups={};
        children.forEach(function(m){
            var ll=m.getLatLng();
            var key=ll.lat.toFixed(4)+'_'+ll.lng.toFixed(4);
            if(!groups[key])groups[key]=[];
            groups[key].push(m);
        });
        // Find biggest colocated group
        var biggest=[];var bigKey='';
        Object.keys(groups).forEach(function(k){
            if(groups[k].length>biggest.length){biggest=groups[k];bigKey=k;}
        });
        if(biggest.length>1){
            // Colocated group found: zoom to area + show selector
            var loc=biggest[0].getLatLng();
            // If mixed cluster, zoom first then show selector
            var groupCount=Object.keys(groups).length;
            if(groupCount>1){
                e.layer.zoomToBounds({padding:[20,20]});
                setTimeout(function(){
                    window._showCheeseSelector(biggest,loc);
                },400);
            }else{
                // Pure colocated: just show selector
                window._showCheeseSelector(biggest,loc);
            }
        }else{
            // No colocated: just zoom
            e.layer.zoomToBounds({padding:[20,20]});
        }
    });

    addGeoCtrl();addZoneCtrl();addLegend();

    S.map.on('moveend',function(){
        if(S.zoneOn){
            if(S.map.getZoom()>=ZT){S.zoneL.clearLayers();drawLocalDebounced();}
            else{S.localL.clearLayers();drawZones();}
        }else{S.localL.clearLayers();S.zoneL.clearLayers();}
    });

    // Show/hide permanent labels based on zoom
    var _labelTimer=null;
    function debouncedLabels(){if(_labelTimer)clearTimeout(_labelTimer);_labelTimer=setTimeout(updateLabels,200);}
    S.map.on('zoomend',debouncedLabels);
    S.map.on('moveend',debouncedLabels);

    S.map.on('click',function(e){
        if(S.focus!==null&&!e.originalEvent._fromMarker){
            // don't close on map click — let overlay handle it
        }
    });

    fetchDepts();
}

function fetchDepts(){
    // Try localStorage cache first
    var cached=lsGet('depts');
    if(cached){S.depts=cached;console.log('Depts OK (cache, '+cached.features.length+')');applyF();return;}
    var urls=[
        'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson',
        'https://france-geojson.gregoiredavid.fr/repo/departements/all.geojson',
        'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson'
    ];
    function go(i){
        if(i>=urls.length){console.warn('Depts: toutes sources échouées.');applyF();return;}
        fetch(urls[i]).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
        .then(function(d){S.depts=d;lsSet('depts',d);console.log('Depts OK ('+d.features.length+')');applyF();})
        .catch(function(){go(i+1);});
    }
    go(0);
}

function loadData(){
    try{var _b=atob(CHEESE_DATA_B64.trim());var _u8=new Uint8Array(_b.length);for(var _i=0;_i<_b.length;_i++)_u8[_i]=_b.charCodeAt(_i);S.data=JSON.parse(new TextDecoder('utf-8').decode(_u8));}
    catch(e){console.error('JSON:',e);track('error_loading',{error:e.message});return;}
    track('cheese_count_loaded',{count:S.data.cheeses.length});
    popFilters();applyF();
    // Update favorites badge
    updateFavBadge();
    // Handle hash routing
    handleHash();
    window.addEventListener('hashchange',handleHash);
    // Auto-open itinerary generator on first visit
    if(window._maybeAutoOpenItin)window._maybeAutoOpenItin();
}

function popFilters(){
    var an=new Set(),lb=new Set(),rg=new Set(),pa=new Set(),sa=new Set(),go=new Set();
    S.data.cheeses.forEach(function(c){
        if(c.an)c.an.split(',').forEach(function(a){a=a.trim();if(a)an.add(a);});
        if(c.lb)lb.add(c.lb);
        if(c.rg)c.rg.forEach(function(r){rg.add(r);});
        if(c.tp){pa.add(c.tp);S.pateNames[c.tp]=getPateShort(c.tp);}
        if(c.go&&c.go!=='-'&&c.go!=='Non précisé')go.add(c.go);
    });
    function pop(id,set,sh){
        var sel=document.getElementById(id);
        Array.from(set).sort().forEach(function(v){
            var o=document.createElement('option');o.value=v;o.textContent=sh?S.pateNames[v]:v;sel.appendChild(o);
        });
    }
    // Desktop filters
    pop('fAnimal',an);pop('fLabel',lb);pop('fRegion',rg);pop('fPate',pa,true);
    // Saison: 4 fixed seasons instead of DB combos
    ['Printemps','Été','Automne','Hiver'].forEach(function(s){
        var o=document.createElement('option');o.value=s;o.textContent=s;
        document.getElementById('fSaison').appendChild(o);
    });
    pop('fGout',go);
    // Mobile filters (clone options)
    function cloneOpts(fromId,toId){
        var from=document.getElementById(fromId),to=document.getElementById(toId);
        Array.from(from.options).forEach(function(o,i){
            if(i===0)return;
            var n=document.createElement('option');n.value=o.value;n.textContent=o.textContent;to.appendChild(n);
        });
    }
    cloneOpts('fAnimal','fAnimalM');cloneOpts('fLabel','fLabelM');
    cloneOpts('fRegion','fRegionM');cloneOpts('fPate','fPateM');
    cloneOpts('fSaison','fSaisonM');cloneOpts('fGout','fGoutM');
}

function getPateShort(tp){
    var p=N(tp);
    if(p.indexOf('fraiche')>-1)return'Pâte fraîche';
    if(p.indexOf('fleurie')>-1)return'Croûte fleurie';
    if(p.indexOf('lavee')>-1)return'Croûte lavée';
    if(p.indexOf('naturelle')>-1)return'Croûte naturelle';
    if(p.indexOf('persillee')>-1||p.indexOf('persille')>-1)return'Persillée';
    if(p.indexOf('non-cuite')>-1||p.indexOf('non cuite')>-1)return'Pressée non-cuite';
    if(p.indexOf('cuite')>-1)return'Pressée cuite';
    return tp||'Autre';
}

function applyF(){
    if(!S.data)return;
    var an=document.getElementById('fAnimal').value;
    var lb=document.getElementById('fLabel').value;
    var rg=document.getElementById('fRegion').value;
    var pa=document.getElementById('fPate').value;
    var sa=document.getElementById('fSaison').value;
    var go=document.getElementById('fGout').value;
    var bi=document.getElementById('fBio').checked;
    var mo=document.getElementById('fMonastic').checked;
    var ep=document.getElementById('fEponyme').checked;
    var q=N(document.getElementById('searchInput').value);

    S.filtered=[];
    S.data.cheeses.forEach(function(c,i){
        var ok=true;
        if(an&&N(c.an).indexOf(N(an))===-1)ok=false;
        if(lb&&N(c.lb)!==N(lb))ok=false;
        if(rg&&(!c.rg||!c.rg.some(function(r){return N(r)===N(rg);})))ok=false;
        if(pa&&N(c.tp)!==N(pa))ok=false;
        if(sa&&N(c.sa||'').indexOf(N(sa))===-1)ok=false;
        if(go&&N(c.go||'').indexOf(N(go))===-1)ok=false;
        if(bi&&!hasBio(c))ok=false;
        if(mo&&!isMonastic(c))ok=false;
        if(ep&&!hasEponyme(c))ok=false;
        if(q){
            // Search in name, label, region, animal, producer names
            var qMatch=N(c.nm).indexOf(q)>-1||N(c.lb||'').indexOf(q)>-1||N(c.an||'').indexOf(q)>-1;
            if(!qMatch&&c.rg)c.rg.forEach(function(r){if(N(r).indexOf(q)>-1)qMatch=true;});
            if(!qMatch&&c.pr)c.pr.forEach(function(p){if(N(p.n).indexOf(q)>-1)qMatch=true;});
            if(!qMatch)ok=false;
        }
        if(ok)S.filtered.push(i);
    });
    S.gridPage=0;
    renderMap();renderGrid();
    document.getElementById('pillBio').classList.toggle('active',bi);
    document.getElementById('pillMonastic').classList.toggle('active',mo);
    document.getElementById('pillEponyme').classList.toggle('active',ep);
    updateMobFilterReset();
    // Encode active filters in URL hash (for sharing)
    var fp=[];
    if(an)fp.push('espece='+encodeURIComponent(an));
    if(lb)fp.push('label='+encodeURIComponent(lb));
    if(rg)fp.push('region='+encodeURIComponent(rg));
    if(pa)fp.push('pate='+encodeURIComponent(pa));
    if(sa)fp.push('saison='+encodeURIComponent(sa));
    if(go)fp.push('gout='+encodeURIComponent(go));
    if(bi)fp.push('bio=1');
    if(mo)fp.push('monastique=1');
    if(ep)fp.push('eponyme=1');
    if(fp.length>0)history.replaceState(null,null,'#'+fp.join('&'));
    else if(!window.location.hash.match(/fromage=/))history.replaceState(null,null,window.location.pathname);
    // GA4: track filter usage
    if(an||lb||rg||pa||sa||go||bi||mo||ep||q)track('filter_used',{animal:an,label:lb,region:rg,pate:pa,saison:sa,gout:go,bio:bi?'oui':'',monastic:mo?'oui':'',eponyme:ep?'oui':'',search:q,results:S.filtered.length});
}

function renderMap(){
    S.cluster.clearLayers();S.markers=[];S._coordCount={};var _frag=[];
    S.filtered.forEach(function(idx){
        var c=S.data.cheeses[idx];
        // Collect valid producer positions
        var positions=[];
        if(c.pr)c.pr.forEach(function(p){if(p.la&&p.lo)positions.push({lat:p.la,lon:p.lo});});

        if(positions.length===0&&c.dc&&c.dc.length>0&&S.depts){
            try{
                var df=S.depts.features.find(function(ft){return ft.properties.code===c.dc[0];});
                if(df){var db2=L.geoJSON(df).getBounds().getCenter();positions.push({lat:db2.lat,lon:db2.lng});}
            }catch(ex){console.warn('Dept fallback error for',c.nm,ex);}
        }
        if(positions.length===0)return;

        // If producers are far apart (>5km), place one marker per producer
        // Otherwise use the average position (single marker)
        var markerPositions=[];
        if(positions.length>1){
            var spread=false;
            for(var pi=1;pi<positions.length;pi++){
                if(_haversine(positions[0].lat,positions[0].lon,positions[pi].lat,positions[pi].lon)>5){spread=true;break;}
            }
            if(spread){markerPositions=positions;}
            else{
                var aLat=0,aLon=0;positions.forEach(function(p){aLat+=p.lat;aLon+=p.lon;});
                markerPositions=[{lat:aLat/positions.length,lon:aLon/positions.length}];
            }
        }else{markerPositions=positions;}

        markerPositions.forEach(function(pos){
            var lat=pos.lat,lon=pos.lon;
            // Micro-offset for colocated markers
            var coordKey=lat.toFixed(4)+'_'+lon.toFixed(4);
            if(!S._coordCount)S._coordCount={};
            if(!S._coordCount[coordKey])S._coordCount[coordKey]=0;
            var off=S._coordCount[coordKey]++;
            if(off>0){lat+=(off%3-1)*0.00015;lon+=((off%2===0?1:-1)*Math.ceil(off/2))*0.00015;}

            var icon=L.divIcon({
                html:'<div class="cheese-mk">'+CHEESE_EMOJI+'</div>',
                iconSize:[28,28],iconAnchor:[14,14],className:''
            });
            var mk=L.marker([lat,lon],{icon:icon});
            mk.bindTooltip(c.nm,{direction:'auto',offset:[0,-14],className:'cheese-tooltip',permanent:false});
            mk.cheeseIdx=idx;
            mk._chLat=lat;mk._chLon=lon;
            mk.on('click',function(e){
                if(e.originalEvent)e.originalEvent._fromMarker=true;
                var mll=mk.getLatLng();
                var colocated=S.markers.filter(function(m2){
                    var ll2=m2.getLatLng();
                    return Math.abs(ll2.lat-mll.lat)<0.0005&&Math.abs(ll2.lng-mll.lng)<0.0005&&S.filtered.indexOf(m2.cheeseIdx)>=0;
                });
                // Deduplicate: same cheeseIdx should only appear once in selector
                var seen={},unique=[];
                colocated.forEach(function(m2){if(!seen[m2.cheeseIdx]){seen[m2.cheeseIdx]=true;unique.push(m2);}});
                if(unique.length>1){
                    window._showCheeseSelector(unique,e.latlng);
                }else{
                    window._focus(idx);
                }
            });
            S.markers.push(mk);_frag.push(mk);
        });
    });

    S.cluster.addLayers(_frag);
    if(S.zoneOn){if(S.map.getZoom()<ZT)drawZones();else drawLocal();}
}

function drawZones(){
    S.zoneL.clearLayers();if(!S.depts)return;
    var dd={};
    S.filtered.forEach(function(i){var c=S.data.cheeses[i];if(c.dc)c.dc.forEach(function(d){dd[d]=(dd[d]||0)+1;});});
    S.depts.features.forEach(function(f){
        var code=f.properties.code;if(!dd[code])return;
        var n=dd[code],op=n>10?0.4:n>4?0.3:0.2;
        var cl=n>10?'#5A6B2F':n>4?'#7A8B47':'#9AAF5C';
        L.geoJSON(f,{style:function(){return{color:cl,weight:1,opacity:0.5,fillColor:cl,fillOpacity:op};}}).addTo(S.zoneL);
    });
}

// Dept-center lookup for viewport filtering (approx centers)
var DEPT_CENTERS={};
function _buildDeptCenters(){
    if(!S.depts||Object.keys(DEPT_CENTERS).length)return;
    S.depts.features.forEach(function(f){
        var c=f.properties.code,b=L.geoJSON(f).getBounds(),ctr=b.getCenter();
        DEPT_CENTERS[c]={lat:ctr.lat,lng:ctr.lng,bounds:b};
    });
}

var _drawLocalTimer=null;
function drawLocalDebounced(){
    if(_drawLocalTimer)clearTimeout(_drawLocalTimer);
    _drawLocalTimer=setTimeout(drawLocal,150);
}

function drawLocal(){
    S.localL.clearLayers();if(S.map.getZoom()<ZT)return;
    _buildDeptCenters();
    var bounds=S.map.getBounds();
    // Expand bounds slightly to preload nearby depts
    var expandedBounds=bounds.pad(0.3);
    var communeToFromages={};
    var deptsNeeded={};
    S.filtered.forEach(function(i){
        var c=S.data.cheeses[i];
        if(!c.zc||!c.zc.length)return;
        c.zc.forEach(function(code){
            if(!communeToFromages[code])communeToFromages[code]=[];
            communeToFromages[code].push(i);
            var d=code.startsWith('2A')||code.startsWith('2B')?code.substring(0,2):code.substring(0,2);
            deptsNeeded[d]=true;
        });
    });
    // Filter depts by viewport — only fetch those visible or nearby
    var deptKeys=Object.keys(deptsNeeded).filter(function(dc){
        if(!DEPT_CENTERS[dc])return true; // unknown → fetch anyway
        return expandedBounds.intersects(DEPT_CENTERS[dc].bounds);
    });
    // Batch fetch: limit concurrent requests to 4
    var queue=deptKeys.slice(),active=0,MAX_CONCURRENT=4;
    function processNext(){
        while(active<MAX_CONCURRENT&&queue.length>0){
            var dc=queue.shift();active++;
            fetchCommunes(dc,function(idx){
                active--;
                if(S.map.getZoom()<ZT)return processNext();
                Object.keys(idx).forEach(function(code){
                    if(!communeToFromages[code])return;
                    var f=idx[code];
                    if(!f||!f.geometry)return;
                    try{
                        var b=L.geoJSON(f).getBounds();
                        if(!bounds.intersects(b))return;
                    }catch(e){return;}
                    var cheeses=communeToFromages[code];
                    var n=cheeses.length;
                    var op=n>3?0.35:n>1?0.25:0.15;
                    var cl='#43A047';
                    var names=cheeses.map(function(i){return S.data.cheeses[i].nm;});
                    var tip=(f.properties.nom||code)+' — '+n+' fromage'+(n>1?'s':'')+' :\n'+names.slice(0,5).join(', ')+(names.length>5?' …':'');
                    L.geoJSON(f,{style:function(){return{color:cl,weight:0.8,opacity:0.5,fillColor:cl,fillOpacity:op};}})
                    .bindTooltip(tip,{sticky:true,className:'zone-tip'})
                    .on('click',function(e){
                        if(cheeses.length===1){window._focus(cheeses[0]);}
                        else{
                            var items=cheeses.map(function(i){var c2=S.data.cheeses[i];return{idx:i,nm:c2.nm,label:c2.lb||''};}).sort(function(a,b){return a.nm.localeCompare(b.nm);});
                            var html='<div class="cheese-selector"><div class="cheese-selector-title">'+items.length+' fromages dans cette commune</div>';
                            items.forEach(function(it){html+='<button class="cheese-selector-item" onclick="window._focus('+it.idx+');this.closest(\'.leaflet-popup\').querySelector(\'.leaflet-popup-close-button\').click();">'+it.nm+(it.label?' <span class=\"cs-label\">'+it.label+'</span>':'')+'</button>';});
                            html+='</div>';
                            L.popup({maxWidth:280}).setLatLng(e.latlng).setContent(html).openOn(S.map);
                        }
                    })
                    .addTo(S.localL);
                });
                processNext();
            });
        }
    }
    processNext();
}

var LABEL_ZOOM=8; // zoom level to show permanent labels
S.groupLabels=[];
function updateLabels(){
    var z=S.map.getZoom();
    var show=z>=LABEL_ZOOM;

    // Remove old group labels
    S.groupLabels.forEach(function(gl){S.map.removeLayer(gl);});
    S.groupLabels=[];

    // Hide all permanent tooltips first
    S.markers.forEach(function(mk){
        var tip=mk.getTooltip();
        if(!tip) return;
        tip.options.permanent=false;
        tip.options.className='cheese-tooltip';
        mk.closeTooltip();
    });

    if(!show) return;

    // Project all visible markers to pixel coords and detect overlaps
    var bounds=S.map.getBounds();
    var items=[];
    S.markers.forEach(function(mk){
        if(!mk._icon) return; // skip markers hidden inside clusters
        var ll=mk.getLatLng();
        if(!bounds.contains(ll)) return;
        var px=S.map.latLngToContainerPoint(ll);
        items.push({mk:mk, px:px, name:S.data.cheeses[mk.cheeseIdx].nm, idx:mk.cheeseIdx, grouped:false, lat:ll.lat, lng:ll.lng});
    });

    // Simple greedy clustering: group items within 80px
    var THRESHOLD=80;
    var groups=[];
    for(var i=0;i<items.length;i++){
        if(items[i].grouped) continue;
        var group=[items[i]];
        items[i].grouped=true;
        for(var j=i+1;j<items.length;j++){
            if(items[j].grouped) continue;
            var dx=items[i].px.x-items[j].px.x;
            var dy=items[i].px.y-items[j].px.y;
            if(Math.sqrt(dx*dx+dy*dy)<THRESHOLD){
                group.push(items[j]);
                items[j].grouped=true;
            }
        }
        groups.push(group);
    }

    groups.forEach(function(g){
        if(g.length===1){
            // Single: show normal permanent label
            var tip=g[0].mk.getTooltip();
            if(tip){
                tip.options.permanent=true;
                tip.options.className='cheese-tooltip perm-label';
                g[0].mk.openTooltip();
            }
        }else{
            // Group: show count label with list on hover
            var cx=0,cy=0;
            g.forEach(function(it){cx+=it.px.x;cy+=it.px.y;});
            cx/=g.length;cy/=g.length;
            var ll=S.map.containerPointToLatLng([cx,cy]);
            var names=g.map(function(it){return it.name;}).sort();
            var listHtml=names.map(function(n){return '<div style="padding:1px 0;">'+n+'</div>';}).join('');
            var label=L.marker(ll,{
                icon:L.divIcon({
                    html:'<div class="group-label"><div class="gl-num">'+g.length+'</div><span class="gl-txt">fromages</span></div>',
                    className:'',iconSize:[0,0],iconAnchor:[0,12]
                }),
                interactive:true,zIndexOffset:1000
            }).addTo(S.map);
            label.bindTooltip('<div class="group-list">'+listHtml+'</div>',{
                direction:'top',offset:[0,-8],className:'cheese-tooltip group-tooltip',
                permanent:false,sticky:false
            });
            // Click on group label -> check colocated or zoom in
            label.on('click',function(){
                // Check if all markers in group are at the same coords (colocated)
                var allSame=true;
                var refLat=g[0].lat,refLng=g[0].lng;
                for(var gi=1;gi<g.length;gi++){
                    if(Math.abs(g[gi].lat-refLat)>0.0005||Math.abs(g[gi].lng-refLng)>0.0005){allSame=false;break;}
                }
                if(allSame && g.length>1){
                    // Colocated: show cheese selector
                    var markers=g.map(function(it){return it.mk;});
                    window._showCheeseSelector(markers,ll);
                }else{
                    S.map.setView(ll,z+2,{animate:true});
                }
            });
            S.groupLabels.push(label);
        }
    });
}


// Lazy load grid card images
var _lazyObs=null;
function initLazyLoad(){
    if(_lazyObs)_lazyObs.disconnect();
    var targets=document.querySelectorAll('.ccard-img[data-name]');
    if(!('IntersectionObserver' in window)){
        targets.forEach(function(el){_loadCardImg(el);});
        return;
    }
    _lazyObs=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
            if(entry.isIntersecting){_loadCardImg(entry.target);_lazyObs.unobserve(entry.target);}
        });
    },{rootMargin:'200px'});
    targets.forEach(function(el){_lazyObs.observe(el);});
}
function _loadCardImg(el){
    var name=el.dataset.name;if(!name)return;
    var slug=cheeseSlug(name);
    if(_imgCache[slug]){el.style.backgroundImage='url('+_imgCache[slug]+')';el.classList.add('ccard-img-loaded');el.removeAttribute('data-name');return;}
    if(_imgCache[slug]===false){el.classList.add('ccard-img-none');el.removeAttribute('data-name');return;}
    loadCheeseImg(name,function(url){
        if(url){el.style.backgroundImage='url('+url+')';el.classList.add('ccard-img-loaded');}
        else{el.classList.add('ccard-img-none');}
    });
    el.removeAttribute('data-name');
}

function renderGrid(){
    var gv=document.getElementById('gridView');gv.innerHTML='';

    // Favorites filtering handled by nav buttons (desktop header + mobile tab)

    // If showing favorites only, filter
    if(S.showFavs){
        var favs=getFavs();
        if(favs.length===0){
            var emptyFav=document.createElement('div');emptyFav.className='empty-state';
            emptyFav.innerHTML='<div style="font-size:2rem;">♡</div><h3>Pas encore de favoris</h3><p>Cliquez sur le cœur d\'un fromage pour l\'ajouter à vos favoris.</p><button onclick="S.showFavs=false;var btn=document.getElementById(\'navFavBtn\');if(btn)btn.classList.remove(\'active\');window._view(\'grid\');" style="margin-top:1rem;padding:0.5rem 1rem;border:1px solid #e8e4de;border-radius:20px;background:#fff;cursor:pointer;font-size:0.85rem;color:#8B6F47;font-family:Inter,sans-serif;">Voir tous les fromages</button>';
            gv.appendChild(emptyFav);
            return;
        }
        S.filtered=S.filtered.filter(function(idx){return favs.indexOf(S.data.cheeses[idx].nm)>=0;});
    }

    // Sort filtered indices alphabetically
    S.filtered.sort(function(a,b){
        var na=S.data.cheeses[a].nm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        var nb=S.data.cheeses[b].nm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        return na<nb?-1:na>nb?1:0;
    });

    // Empty state
    if(S.filtered.length===0){
        var empty=document.createElement('div');empty.className='empty-state';
        empty.innerHTML='<div class="emoji" style="font-size:2rem;">—</div><h3>Aucun fromage trouvé</h3><p>Essayez de modifier vos filtres ou votre recherche pour découvrir d\'autres fromages.</p>';
        gv.appendChild(empty);
        return;
    }

    // Build alphabet index
    var letters={};
    for(var k=0;k<S.filtered.length;k++){
        var firstChar=S.data.cheeses[S.filtered[k]].nm.charAt(0).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        if(!firstChar.match(/[A-Z]/))continue;
        letters[firstChar]=true;
    }
    var alphaBar=document.createElement('div');alphaBar.className='alpha-index';
    // Scroll helper: scroll inside gridView only, offset for sticky alpha bar
    function scrollToLetter(letterId){
        var target=document.getElementById(letterId);
        if(!target)return;
        var alphaH=alphaBar.offsetHeight||40;
        gv.scrollTo({top:target.offsetTop-alphaH,behavior:'smooth'});
    }
    // Desktop: individual letters
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function(l){
        var btn=document.createElement('button');btn.className='alpha-btn alpha-single';btn.textContent=l;
        if(!letters[l]){btn.classList.add('disabled');}
        else{btn.onclick=function(){scrollToLetter('letter-'+l);};}
        alphaBar.appendChild(btn);
    });
    // Mobile: grouped letters
    var groups=['ABC','DEF','GHI','JKL','MNO','PQR','STU','VWX','YZ'];
    groups.forEach(function(g){
        var btn=document.createElement('button');btn.className='alpha-btn alpha-group';
        btn.textContent=g.charAt(0)+'-'+g.charAt(g.length-1);
        var hasAny=false;
        for(var i=0;i<g.length;i++){if(letters[g.charAt(i)])hasAny=true;}
        if(!hasAny){btn.classList.add('disabled');}
        else{btn.onclick=function(){
            for(var i=0;i<g.length;i++){
                var t=document.getElementById('letter-'+g.charAt(i));
                if(t){scrollToLetter('letter-'+g.charAt(i));break;}
            }
        };}
        alphaBar.appendChild(btn);
    });
    gv.appendChild(alphaBar);

    // Grid inner container
    var gi=document.createElement('div');gi.className='grid-inner';

    // Render all with letter separators
    var total=S.filtered.length;
    var currentLetter='';

    for(var j=0;j<total;j++){
        var idx=S.filtered[j];
        var c=S.data.cheeses[idx];
        // Letter separator
        var fl=c.nm.charAt(0).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        if(fl.match(/[A-Z]/)&&fl!==currentLetter){
            currentLetter=fl;
            var sep=document.createElement('div');sep.className='alpha-sep';sep.id='letter-'+fl;sep.textContent=fl;
            gi.appendChild(sep);
        }
        var card=document.createElement('div');card.className='ccard';
        card.onclick=(function(i){return function(){window._focus(i);};})(idx);
        var top=document.createElement('div');top.className='ccard-top';
        var topName=document.createElement('span');topName.textContent=c.nm;top.appendChild(topName);
        var heartSpan=document.createElement('span');heartSpan.className='ccard-fav'+(isFav(c.nm)?' ccard-fav-active':'');
        heartSpan.dataset.name=c.nm;heartSpan.textContent=isFav(c.nm)?'♥':'♡';
        heartSpan.onclick=(function(name,hs){return function(e){
            e.stopPropagation();
            var added=toggleFav(name);
            hs.textContent=added?'♥':'♡';
            hs.classList.toggle('ccard-fav-active',added);
        };})(c.nm,heartSpan);
        top.appendChild(heartSpan);
        card.appendChild(top);
        // Always create image placeholder — lazy-loaded
        var _slug=cheeseSlug(c.nm);
        var cimg=document.createElement('div');cimg.className='ccard-img';cimg.dataset.name=c.nm;
        if(_imgCache[_slug]){cimg.style.backgroundImage='url('+_imgCache[_slug]+')';cimg.classList.add('ccard-img-loaded');}
        else if(_imgCache[_slug]===false){cimg.classList.add('ccard-img-none');}
        card.appendChild(cimg);
        var body=document.createElement('div');body.className='ccard-body';
        var lb=document.createElement('div');lb.className='ccard-label';lb.textContent=c.lb||'';
        var an=document.createElement('div');an.className='ccard-an';an.textContent=c.an||'-';
        var bg=document.createElement('div');bg.className='ccard-badges';
        if(c.ao&&c.ao.aop){var b1=document.createElement('span');b1.className='badge b-aop';b1.textContent='AOP';bg.appendChild(b1);}
        if(c.ao&&c.ao.aoc){var b1c=document.createElement('span');b1c.className='badge b-aoc';b1c.textContent='AOC';bg.appendChild(b1c);}
        if(c.ao&&c.ao.igp){var b1g=document.createElement('span');b1g.className='badge b-igp';b1g.textContent='IGP';bg.appendChild(b1g);}
        if(isMonastic(c)){var b2=document.createElement('span');b2.className='badge b-mon';b2.textContent='Monastique';bg.appendChild(b2);}
        if(hasEponyme(c)){var b3=document.createElement('span');b3.className='badge b-epo';b3.textContent='Éponyme';bg.appendChild(b3);}
        var pr=document.createElement('div');pr.className='ccard-pr';pr.textContent=c.pr&&c.pr.length>0?c.pr[0].n:'';
        body.appendChild(lb);body.appendChild(an);body.appendChild(bg);body.appendChild(pr);
        // "Voir sur la carte" button
        var mapBtn=document.createElement('button');mapBtn.className='ccard-map-btn';mapBtn.textContent='Voir sur la carte';
        mapBtn.onclick=(function(i){return function(e){e.stopPropagation();window._view('map');setTimeout(function(){window._focus(i);},200);};})(idx);
        body.appendChild(mapBtn);
        card.appendChild(body);gi.appendChild(card);
    }
    gv.appendChild(gi);
    requestAnimationFrame(initLazyLoad);
}

// ── HASH ROUTING ──
function handleHash(){
    var hash=window.location.hash;
    if(hash&&hash.indexOf('#fromage=')===0){
        var name=decodeURIComponent(hash.substring(9));
        if(S.data){
            var idx=S.data.cheeses.findIndex(function(c){return N(c.nm)===N(name);});
            if(idx>=0)setTimeout(function(){window._focus(idx);},300);
        }
    }else if(hash&&hash.length>1&&hash.indexOf('fromage=')===-1){
        // Restore filters from hash (e.g. #espece=Chèvre&region=Occitanie)
        var params={};hash.substring(1).split('&').forEach(function(p){var kv=p.split('=');if(kv.length===2)params[kv[0]]=decodeURIComponent(kv[1]);});
        if(params.espece)document.getElementById('fAnimal').value=params.espece;
        if(params.label)document.getElementById('fLabel').value=params.label;
        if(params.region)document.getElementById('fRegion').value=params.region;
        if(params.pate)document.getElementById('fPate').value=params.pate;
        if(params.saison)document.getElementById('fSaison').value=params.saison;
        if(params.gout)document.getElementById('fGout').value=params.gout;
        if(params.bio)document.getElementById('fBio').checked=true;
        if(params.monastique)document.getElementById('fMonastic').checked=true;
        if(params.eponyme)document.getElementById('fEponyme').checked=true;
        if(Object.keys(params).length>0)setTimeout(function(){applyF();},300);
    }
}

// ── FOCUS ──
window._focus=function(idx){
    S.focus=idx;
    var c=S.data.cheeses[idx];
    track('cheese_view',{cheese_name:c.nm,label:c.lb||'',region:(c.rg&&c.rg[0])||'',animal:c.an||''});
    document.getElementById('dName').textContent=c.nm;
    document.getElementById('dLabel').textContent=c.lb||'';
    // Clean up previous heart icon in header
    var oldHeadFav=document.querySelector('.dhead-fav');
    if(oldHeadFav)oldHeadFav.remove();
    var dimg=document.getElementById('dImg');
    // Photos from img/ folder only (slug-based auto-detect, .jpg/.jpeg)
    var _slug=cheeseSlug(c.nm);
    if(_imgCache[_slug]){
        dimg.style.backgroundImage='url('+_imgCache[_slug]+')';dimg.classList.add('has-img');
    }else if(_imgCache[_slug]===false){
        dimg.style.backgroundImage='';dimg.classList.remove('has-img');
    }else{
        dimg.style.backgroundImage='';dimg.classList.remove('has-img');
        loadCheeseImg(c.nm,function(url){
            if(url){dimg.style.backgroundImage='url('+url+')';dimg.classList.add('has-img');}
        });
    }

    // Update hash without scrolling
    history.replaceState(null,null,'#fromage='+encodeURIComponent(c.nm));

    var db=document.getElementById('dBody');db.innerHTML='';

    // Label row: badges + share button on same line
    var labelRow=document.createElement('div');labelRow.className='dlabel-row';
    // Badges
    var bx=document.createElement('div');bx.className='dlabel-badges';
    if(c.ao&&c.ao.da){var b1=document.createElement('span');b1.className='badge b-aop';b1.textContent='AOP';bx.appendChild(b1);}
    if(c.ao&&c.ao.dc_aoc){var b1c=document.createElement('span');b1c.className='badge b-aoc';b1c.textContent='AOC';bx.appendChild(b1c);}
    if(c.ao&&c.ao.di){var b1g=document.createElement('span');b1g.className='badge b-igp';b1g.textContent='IGP';bx.appendChild(b1g);}
    if(isMonastic(c)){var bm=document.createElement('span');bm.className='badge b-mon';bm.textContent='Monastique';bx.appendChild(bm);}
    if(hasEponyme(c)){var be=document.createElement('span');be.className='badge b-epo';be.textContent='Éponyme';bx.appendChild(be);}
    labelRow.appendChild(bx);
    // Share button
    var shareBtn=document.createElement('button');shareBtn.className='dshare';
    shareBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Partager';
    shareBtn.onclick=function(){
        var url=window.location.origin+window.location.pathname+'#fromage='+encodeURIComponent(c.nm);
        if(navigator.clipboard&&navigator.clipboard.writeText){
            navigator.clipboard.writeText(url).then(function(){
                shareBtn.classList.add('dshare-ok');
                shareBtn.innerHTML='✓ Lien copié !';
                setTimeout(function(){
                    shareBtn.classList.remove('dshare-ok');
                    shareBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Partager';
                },2000);
            });
        }else{
            prompt('Copier ce lien :',url);
        }
    };
    if(isMobile()){
        // Mobile: share button in header next to cheese name
        var headShare=document.getElementById('dHeadShare');
        headShare.innerHTML='';headShare.appendChild(shareBtn);
    }else{
        labelRow.appendChild(shareBtn);
    }
    db.appendChild(labelRow);

    // Favorite button
    var favBtn=document.createElement('button');favBtn.className='dfav';
    var _isFav=isFav(c.nm);
    favBtn.innerHTML=(_isFav?'♥':'♡')+' '+(_isFav?'Favori':'Ajouter aux favoris');
    if(_isFav)favBtn.classList.add('dfav-active');
    favBtn.onclick=function(){
        var added=toggleFav(c.nm);
        favBtn.innerHTML=(added?'♥ Favori':'♡ Ajouter aux favoris');
        favBtn.classList.toggle('dfav-active',added);
        // Update card heart if visible
        document.querySelectorAll('.ccard-fav[data-name="'+CSS.escape(c.nm)+'"]').forEach(function(h){
            h.textContent=added?'♥':'♡';h.classList.toggle('ccard-fav-active',added);
        });
    };
    if(isMobile()){
        // Mobile: small heart in header next to share button
        var headFav=document.createElement('span');headFav.className='dhead-fav'+(_isFav?' dhead-fav-active':'');
        headFav.textContent=_isFav?'♥':'♡';
        headFav.onclick=function(){
            var added=toggleFav(c.nm);
            headFav.textContent=added?'♥':'♡';
            headFav.classList.toggle('dhead-fav-active',added);
            document.querySelectorAll('.ccard-fav[data-name="'+CSS.escape(c.nm)+'"]').forEach(function(h){
                h.textContent=added?'♥':'♡';h.classList.toggle('ccard-fav-active',added);
            });
        };
        var headShare=document.getElementById('dHeadShare');
        headShare.parentNode.insertBefore(headFav, headShare);
    }else{
        // Desktop: compact fav button in label row
        labelRow.appendChild(favBtn);
    }

    // Characteristics grid — wrapped in toggle on mobile
    var grid=document.createElement('div');grid.className='dgrid';
    function addI(l,v){
        if(!v||v==='-')return;
        var d=document.createElement('div');d.className='ditem';
        var dl=document.createElement('div');dl.className='ditem-l';dl.textContent=l;
        var dv=document.createElement('div');dv.className='ditem-v';dv.textContent=v||'Non précisé';
        d.appendChild(dl);d.appendChild(dv);grid.appendChild(d);
    }
    addI('Espèce',c.an);addI('Type de lait',c.lc||'Non précisé');addI('Type de pâte',c.tp);
    addI('Affinage',c.af||'Non précisé');addI('Saison optimale',c.sa);addI('Goût',c.go);
    if(grid.children.length>0){
        if(isMobile()){
            db.appendChild(mkSec('Caractéristiques', function(inner){inner.appendChild(grid);}, false));
        }else{
            db.appendChild(grid);
        }
    }

    // Helper: section with mobile accordion
    function mkSec(title, contentFn, startOpen){
        var sec=document.createElement('div');sec.className='dsec';
        var h=document.createElement('h3');h.textContent=title;
        var body=document.createElement('div');body.className='dsec-body';
        contentFn(body);
        if(isMobile()){
            // Wrap h3 in toggle div for accordion
            var toggle=document.createElement('div');toggle.className='dsec-toggle';
            toggle.appendChild(h);
            toggle.addEventListener('click',function(){sec.classList.toggle('collapsed');});
            sec.appendChild(toggle);
            if(!startOpen) sec.classList.add('collapsed');
        }else{
            sec.appendChild(h);
        }
        sec.appendChild(body);
        return sec;
    }

    // Fun Fact — open by default (most interesting content)
    if(c.ff&&c.ff!=='-'){
        db.appendChild(mkSec('Fun Fact', function(inner){
            var t1=document.createElement('div');t1.className='dtext';t1.textContent=c.ff;
            inner.appendChild(t1);
        }, false));
    }
    // Monastique — collapsed on mobile
    if(isMonastic(c)){
        db.appendChild(mkSec('Héritage monastique', function(inner){
            var t2=document.createElement('div');t2.className='dtext';t2.textContent=c.fm;
            inner.appendChild(t2);
        }, false));
    }
    // AOP/AOC/IGP details — collapsed on mobile
    if(c.ao&&(c.ao.da||c.ao.dc_aoc||c.ao.di)){
        db.appendChild(mkSec('Appellation', function(inner){
            var aoGrid=document.createElement('div');aoGrid.className='dgrid';
            if(c.ao.da){var d1=document.createElement('div');d1.className='ditem';d1.innerHTML='<div class="ditem-l">Date AOP</div><div class="ditem-v">'+c.ao.da.replace(/\.0$/,'')+'</div>';aoGrid.appendChild(d1);}
            if(c.ao.dc_aoc){var d2=document.createElement('div');d2.className='ditem';d2.innerHTML='<div class="ditem-l">Date AOC</div><div class="ditem-v">'+c.ao.dc_aoc.replace(/\.0$/,'')+'</div>';aoGrid.appendChild(d2);}
            if(c.ao.di){var d3=document.createElement('div');d3.className='ditem';d3.innerHTML='<div class="ditem-l">Date IGP</div><div class="ditem-v">'+c.ao.di.replace(/\.0$/,'')+'</div>';aoGrid.appendChild(d3);}
            if(c.ao.og&&c.ao.og!=='-'){var d4=document.createElement('div');d4.className='ditem';d4.innerHTML='<div class="ditem-l">OGM (cahier des charges)</div><div class="ditem-v">'+c.ao.og+'</div>';aoGrid.appendChild(d4);}
            if(c.ao.pf){var pf=parseFloat(c.ao.pf);if(!isNaN(pf)){var d5=document.createElement('div');d5.className='ditem';d5.innerHTML='<div class="ditem-l">Production fermière</div><div class="ditem-v">'+(pf*100).toFixed(1)+'%</div>';aoGrid.appendChild(d5);}}
            inner.appendChild(aoGrid);
            if(c.ao.sp&&c.ao.sp!=='-'){
                var spDiv=document.createElement('div');spDiv.className='dtext';spDiv.style.marginTop='0.6rem';
                var spLbl=document.createElement('div');spLbl.className='dtext-l';spLbl.textContent='Saisonnalité de production';
                spDiv.appendChild(spLbl);spDiv.appendChild(document.createTextNode(c.ao.sp));
                inner.appendChild(spDiv);
            }
            if(c.ao.cm&&c.ao.cm!=='-'){
                var rec=document.createElement('div');rec.className='dtext';rec.style.marginTop='0.6rem';
                var cmLbl=document.createElement('div');cmLbl.className='dtext-l';cmLbl.textContent='Commentaire';
                rec.appendChild(cmLbl);rec.appendChild(document.createTextNode(c.ao.cm));
                inner.appendChild(rec);
            }
        }, false));
    }
    // Producers — collapsed on mobile
    if(c.pr&&c.pr.length>0){
        db.appendChild(mkSec('Producteurs ('+c.pr.length+')', function(inner){
            if(c.pr.length>1){
                var hint=document.createElement('div');hint.style.cssText='font-size:0.72rem;color:#999;margin-bottom:0.5rem;';
                hint.textContent='Cliquez sur un producteur pour le localiser sur la carte';
                inner.appendChild(hint);
            }
            var ul=document.createElement('ul');ul.className='prlist';
            c.pr.forEach(function(p){
                var li=document.createElement('li');li.className='pritem';
                var ns=document.createElement('span');ns.className='prname';ns.textContent=p.n;
                if(p.la&&p.lo){
                    ns.style.cursor='pointer';
                    ns.onclick=function(e){e.stopPropagation();window._zoomProducer(p,c.nm);};
                }
                var dv=document.createElement('div');dv.style.cssText='display:flex;gap:0.3rem;align-items:center;';
                if(p.b){var bg=document.createElement('span');bg.className='prbadge';bg.textContent='Bio';dv.appendChild(bg);}
                var btn=document.createElement('button');btn.className='ibtn';btn.textContent='+Itinéraire';
                btn.onclick=function(e){e.stopPropagation();window._addItin(p,c.nm);};
                dv.appendChild(btn);li.appendChild(ns);li.appendChild(dv);ul.appendChild(li);
            });
            inner.appendChild(ul);
        }, false));
    }
    // Éponymes — collapsed on mobile
    if(hasEponyme(c)){
        db.appendChild(mkSec('Communes éponymes', function(inner){
            var t6=document.createElement('div');t6.className='dtext';
            t6.textContent=c.ep.filter(function(e){return e&&e.nom;}).map(function(e){return e.nom;}).join(', ');
            inner.appendChild(t6);
        }, false));
    }

    // Inline legend
    var leg=document.createElement('div');leg.className='dlegend';
    leg.innerHTML='<div class="dleg-title">Légende carte</div>'+
        '<div class="dleg-row"><span class="dleg-dot" style="background:#8B6F47;font-size:6px;">'+CHEESE_EMOJI+'</span> Fromage</div>'+
        '<div class="dleg-row"><span class="dleg-dot" style="background:#E8836B;">'+HOUSE_SVG.replace(/width="\d+"/g,'width="6"').replace(/height="\d+"/g,'height="6"')+'</span> Producteur</div>'+
        '<div class="dleg-row"><span class="dleg-dot" style="background:#5D4037;">'+FLAG_SVG.replace(/width="\d+"/g,'width="6"').replace(/height="\d+"/g,'height="6"')+'</span> Commune éponyme</div>'+
        '<div class="dleg-row"><span class="dleg-dot" style="background:#66BB6A;"></span> Zone de production</div>';
    db.appendChild(leg);

    document.getElementById('detail').classList.add('open');
    document.getElementById('panelZoomFloat').classList.add('visible');

    // Recenter map so zone is visible LEFT of the 380px panel
    // The panel is position:fixed (overlays the map, doesn't resize it)
    // So we manually calculate an offset center and appropriate zoom
    highlightZone(idx, function(){
        setTimeout(function(){
            var mob=isMobile();
            if(mob){
                // MOBILE: don't zoom out at all, just pan to the cheese center
                // Offset upward so cheese appears above the peek panel (90px) + tab bar (56px)
                var peekH=90+56; // panel + tab bar
                var center;
                // Get zone/producer center
                var bounds=null;
                if(S.focusL.getLayers().length>0){
                    try{var b=S.focusL.getBounds();if(b.isValid())bounds=b;}catch(ex){}
                }
                if(!bounds){
                    var lats=[],lons=[];
                    if(c.pr)c.pr.forEach(function(p){if(p.la&&p.lo){lats.push(p.la);lons.push(p.lo);}});
                    if(lats.length>0) bounds=L.latLngBounds([Math.min.apply(null,lats),Math.min.apply(null,lons)],[Math.max.apply(null,lats),Math.max.apply(null,lons)]);
                }
                center=bounds?bounds.getCenter():S.map.getCenter();
                var zoom=S.map.getZoom(); // keep current zoom, don't change it
                var pt=S.map.project(center,zoom);
                pt.y+=peekH/2; // shift center south so cheese appears above panel
                var offsetCenter=S.map.unproject(pt,zoom);
                S.map.panTo(offsetCenter,{animate:true});
            }else{
                // DESKTOP: fit bounds left of the 380px panel
                var panelW=380;
                var margin=40;
                var bounds=null;
                if(S.focusL.getLayers().length>0){
                    try{var b=S.focusL.getBounds();if(b.isValid())bounds=b;}catch(ex){}
                }
                if(!bounds){
                    var lats=[],lons=[];
                    if(c.pr)c.pr.forEach(function(p){if(p.la&&p.lo){lats.push(p.la);lons.push(p.lo);}});
                    if(lats.length>0) bounds=L.latLngBounds([Math.min.apply(null,lats),Math.min.apply(null,lons)],[Math.max.apply(null,lats),Math.max.apply(null,lons)]);
                }
                if(!bounds)return;
                var totalPad=L.point(panelW+margin*2, margin*2);
                var zoom=S.map.getBoundsZoom(bounds,false,totalPad);
                zoom=Math.min(zoom,8);
                var center=bounds.getCenter();
                var pt=S.map.project(center,zoom);
                pt.x+=panelW/2;
                var offsetCenter=S.map.unproject(pt,zoom);
                S.map.setView(offsetCenter,zoom,{animate:true});
            }
        },500);
    });
};

// Cheese selector popup for co-located markers
window._showCheeseSelector=function(markers,latlng){
    var items=markers.map(function(m){
        var c=S.data.cheeses[m.cheeseIdx];
        var label=c.lb||'';
        return {idx:m.cheeseIdx, nm:c.nm, label:label};
    }).sort(function(a,b){return a.nm.localeCompare(b.nm);});

    var html='<div class="cheese-selector">';
    html+='<div class="cheese-selector-title">'+items.length+' fromages à cet endroit</div>';
    items.forEach(function(it){
        html+='<button class="cheese-selector-item" onclick="window._focus('+it.idx+');this.closest(\'.leaflet-popup\').querySelector(\'.leaflet-popup-close-button\').click();">'+it.nm;
        if(it.label) html+=' <span class="cs-label">'+it.label+'</span>';
        html+='</button>';
    });
    html+='</div>';

    L.popup({maxWidth:280,className:'cheese-selector-popup'})
        .setLatLng(latlng)
        .setContent(html)
        .openOn(S.map);
};

window._zoomProducer=function(p,cheeseName){
    if(!p.la||!p.lo)return;
    var panelW=isMobile()?0:380;
    var zoom=13;
    var point=S.map.project([p.la,p.lo],zoom);
    point.x+=panelW/2;
    var offsetLL=S.map.unproject(point,zoom);
    S.map.setView(offsetLL,zoom,{animate:true});
    // Flash the producer marker on the focusL layer
    S.focusL.eachLayer(function(layer){
        if(layer.getLatLng){
            var ll=layer.getLatLng();
            if(Math.abs(ll.lat-p.la)<0.0001&&Math.abs(ll.lng-p.lo)<0.0001){
                layer.openPopup();
                // Pulse effect
                var el=layer.getElement();
                if(el){
                    el.style.transition='transform 0.3s';
                    el.style.transform='scale(1.5)';
                    setTimeout(function(){el.style.transform='scale(1)';},600);
                }
            }
        }
    });
};

// _panelZoom is defined in initMap() for guaranteed S.map access

// ── Mobile bottom sheet: 3-state drag (closed ↔ peek ↔ expanded) ──
(function(){
    var detail=document.getElementById('detail');
    var startY=0,dragging=false;
    detail.addEventListener('touchstart',function(e){
        if(!isMobile())return;
        var t=e.touches[0];
        var rect=detail.getBoundingClientRect();
        var isExpanded=detail.classList.contains('expanded');
        // In peek mode: entire visible panel is draggable (~90px)
        // In expanded mode: only top 80px (handle + header) is draggable
        var dragZone=isExpanded?80:100;
        if(t.clientY-rect.top>dragZone)return;
        startY=t.clientY;
        dragging=true;
    },{passive:true});
    detail.addEventListener('touchmove',function(e){
        if(!dragging)return;
        var dy=startY-e.touches[0].clientY;
        // Swipe threshold: 30px (more sensitive than before)
        if(dy>30&&!detail.classList.contains('expanded')){
            // Swipe up: peek → expanded
            detail.classList.add('expanded');
            dragging=false;
        }else if(dy<-30){
            if(detail.classList.contains('expanded')){
                // Swipe down from expanded → back to peek
                detail.classList.remove('expanded');
                dragging=false;
            }else{
                // Swipe down from peek → close
                window._closeDetail();
                dragging=false;
            }
        }
    },{passive:true});
    detail.addEventListener('touchend',function(){dragging=false;},{passive:true});
    // Tap header/handle area: peek → expanded (or expanded → peek)
    var dnav=detail.querySelector('.dnav');
    if(dnav){
        dnav.addEventListener('click',function(e){
            if(!isMobile())return;
            if(e.target.closest('.dclose,.dreduce'))return;
            detail.classList.toggle('expanded');
        });
    }
    // Peek action buttons are handled via inline onclick in HTML
})();

window._closeDetail=function(){
    S.focus=null;
    document.getElementById('detail').classList.remove('open');
    document.getElementById('detail').classList.remove('expanded');
    document.getElementById('panelZoomFloat').classList.remove('visible');
    S.focusL.clearLayers();
    // Clear hash
    history.replaceState(null,null,window.location.pathname+window.location.search);
};

function highlightZone(idx, doneCb){
    S.focusL.clearLayers();
    var c=S.data.cheeses[idx];
    var pending=0;
    var epPending=0;
    var cbFired=false;
    function tryDone(){if(!cbFired&&pending<=0&&epPending<=0&&doneCb){cbFired=true;doneCb();}}
    if(c.zc&&c.zc.length>0){
        var codeSet={};c.zc.forEach(function(code){codeSet[code]=true;});
        var deptsNeeded={};c.zc.forEach(function(code){deptsNeeded[code.substring(0,2)]=true;});
        var deptKeys=Object.keys(deptsNeeded);
        pending=deptKeys.length;
        var allFeatures=[];
        deptKeys.forEach(function(dc){
            fetchCommunes(dc,function(idx2){
                Object.keys(idx2).forEach(function(code){
                    if(!codeSet[code])return;
                    var f=idx2[code];if(!f||!f.geometry)return;
                    allFeatures.push(f);
                });
                pending--;
                if(pending<=0){
                    if(allFeatures.length>0){
                        // Merge all commune polygons into one MultiPolygon for cleaner zone outline
                        var mergedCoords=[];
                        allFeatures.forEach(function(f){
                            var g=f.geometry;
                            if(g.type==='Polygon')mergedCoords.push(g.coordinates);
                            else if(g.type==='MultiPolygon')g.coordinates.forEach(function(c){mergedCoords.push(c);});
                        });
                        var merged={type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'MultiPolygon',coordinates:mergedCoords},properties:{}}]};
                        L.geoJSON(merged,{style:function(){return{color:'#7A9A3E',weight:1.5,opacity:0.6,fillColor:'#B5C98A',fillOpacity:0.2};}}).addTo(S.focusL);
                    }
                    tryDone();
                }
            });
        });
    }
    if(c.pr){
        c.pr.forEach(function(p){
            if(!p.la||!p.lo)return;
            var bio=p.b?'border:2px solid #43A047;':'border:1.5px solid #fff;';
            var ic=L.divIcon({
                html:'<div style="width:22px;height:22px;border-radius:50%;background:#E8836B;'+bio+'display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.2);">'+HOUSE_SVG+'</div>',
                iconSize:[22,22],iconAnchor:[11,11],className:''
            });
            var mk=L.marker([p.la,p.lo],{icon:ic}).addTo(S.focusL);
            var bt=p.b?' <span style="background:#43A047;color:#fff;padding:1px 4px;border-radius:3px;font-size:9px;">Bio</span>':'';
            mk.bindPopup('<strong>'+p.n+'</strong>'+bt+'<br><span style="color:#999;font-size:0.8rem;">'+c.nm+'</span><br><a href="#" onclick="window._addItin({n:\''+p.n.replace(/'/g,"\\'")+'\',la:'+p.la+',lo:'+p.lo+',b:'+(p.b?'true':'false')+'},\''+c.nm.replace(/'/g,"\\'")+'\');return false;" style="color:#8B6F47;font-size:0.82rem;">+ Ajouter à l\'itinéraire</a>');
            mk.bindTooltip('Cliquez pour ajouter à l\'itinéraire',{direction:'top',offset:[0,-14],className:'cheese-tooltip',permanent:false});
            mk.on('click',function(){
                window._addItin({n:p.n,la:p.la,lo:p.lo,b:!!p.b},c.nm);
            });
        });
    }
    if(c.ep&&c.ep.length>0){
        c.ep.forEach(function(e){
            if(!e||!e.code)return;
            epPending++;
            var dc=e.code.substring(0,2);
            fetchCommunes(dc,function(idx2){
                var f=idx2[e.code];
                var lat=0,lon=0;
                if(f&&f.geometry){
                    try{var b=L.geoJSON(f).getBounds().getCenter();lat=b.lat;lon=b.lng;}catch(err){}
                }
                if(lat===0&&c.pr&&c.pr.length>0&&c.pr[0].la){lat=c.pr[0].la+0.008;lon=c.pr[0].lo+0.008;}
                if(lat!==0){
                    var ic=L.divIcon({
                        html:'<div style="width:22px;height:22px;border-radius:50%;background:#5D4037;border:1.5px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.2);">'+FLAG_SVG+'</div>',
                        iconSize:[22,22],iconAnchor:[11,11],className:''
                    });
                    var mk=L.marker([lat,lon],{icon:ic}).addTo(S.focusL);
                    mk.bindPopup('Commune éponyme : <strong>'+e.nom+'</strong><br><span style="color:#999;font-size:0.8rem;">'+c.nm+'</span>');
                }
                epPending--;
                tryDone();
            });
        });
    }
    // Fire callback immediately only if no async ops pending
    tryDone();
}

// ── VIEW SWITCH ──
window._view=function(v){
    S.currentView=v;
    var m=document.getElementById('map'),g=document.getElementById('gridView'),btns=document.querySelectorAll('.vbtn');
    if(v==='map'){m.style.display='block';g.classList.remove('active');btns[0].classList.add('active');btns[1].classList.remove('active');setTimeout(function(){S.map.invalidateSize();},0);}
    else{m.style.display='none';g.classList.add('active');btns[0].classList.remove('active');btns[1].classList.add('active');renderGrid();g.scrollTop=0;}
};

window._reset=function(){
    ['fAnimal','fLabel','fRegion','fPate','fSaison','fGout'].forEach(function(id){document.getElementById(id).value='';});
    document.getElementById('fBio').checked=false;
    document.getElementById('fMonastic').checked=false;
    document.getElementById('fEponyme').checked=false;
    document.getElementById('searchInput').value='';
    S.focusL.clearLayers();
    S.map.setView([46.5,2.5],6,{animate:true});
    applyF();
    updateMobFilterReset();
};

// Mobile floating reset button — show/hide based on active filters
window._mobResetFilters=function(){window._reset();};
function updateMobFilterReset(){
    var btn=document.getElementById('mobFilterReset');
    if(!btn)return;
    var hasFilter=['fAnimal','fLabel','fRegion','fPate','fSaison','fGout'].some(function(id){return document.getElementById(id).value!=='';})
        || document.getElementById('fBio').checked || document.getElementById('fMonastic').checked || document.getElementById('fEponyme').checked
        || document.getElementById('searchInput').value!=='';
    btn.classList.toggle('visible',hasFilter&&isMobile());
}

// ── ITINERARY ──
window._addItin=function(pr,cn){
    if(S.itin.some(function(s){return s.pr.n===pr.n&&s.cn===cn;})){
        showToast('Déjà dans l\'itinéraire');return;
    }
    S.itin.push({pr:pr,cn:cn});
    _saveItin();
    renderItin();
    document.getElementById('itin').classList.add('open');
    updateItinBadge();
    showToast('✓ '+pr.n+' ajouté à l\'itinéraire');
};
function showToast(msg){
    var existing=document.querySelector('.itin-toast');
    if(existing)existing.remove();
    var t=document.createElement('div');t.className='itin-toast';t.textContent=msg;
    document.body.appendChild(t);
    setTimeout(function(){t.classList.add('show');},10);
    setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},300);},2000);
}

function renderItin(){
    var body=document.getElementById('itinBody');body.innerHTML='';
    var exportPanel=document.getElementById('itinExport');

    if(S.itin.length===0){
        body.innerHTML='<p style="color:#999;font-size:0.82rem;line-height:1.5;"><a href="#" onclick="event.preventDefault();window._toggleItin();" style="color:#8B6F47;text-decoration:underline;">Ajoutez des producteurs</a> ou <a href="#" onclick="event.preventDefault();window._toggleItin();setTimeout(function(){window._openItinGen();},200);" style="color:#8B6F47;text-decoration:underline;">créer ton itinéraire</a></p>';
        exportPanel.classList.remove('has-items');
        return;
    }

    // Show/hide export buttons
    if(S.itin.length>=2){exportPanel.classList.add('has-items');}
    else{exportPanel.classList.remove('has-items');}

    var hasGeoStart=S.itin.length>0&&S.itin[0].isGeo;
    if(S.userLoc&&!hasGeoStart){
        var gb=document.createElement('button');gb.className='mbtn mbtn-outline';gb.style.marginBottom='0.6rem';
        gb.textContent='📍 Ma position comme départ';
        gb.onclick=function(){
            S.itin.unshift({pr:{n:'Ma position',la:S.userLoc.lat,lo:S.userLoc.lon},cn:'Point de départ',isGeo:true});
            _saveItin();renderItin();drawRoute();
        };
        body.appendChild(gb);
    }

    S.itin.forEach(function(stop,i){
        var d=document.createElement('div');d.className='istop';
        var icon=stop.isGeo?'📍 ':'';
        d.innerHTML='<strong>'+icon+(i+1)+'. '+stop.pr.n+'</strong><br><span style="color:#999;font-size:0.78rem;">'+stop.cn+'</span>';
        var del=document.createElement('span');del.className='istop-del';del.textContent='✕';
        del.onclick=function(){S.itin.splice(i,1);_saveItin();renderItin();drawRoute();updateItinBadge();if(S.itin.length===0)document.getElementById('itin').classList.remove('open');};
        d.appendChild(del);body.appendChild(d);

        if(i<S.itin.length-1){
            var dist=hav(S.itin[i].pr,S.itin[i+1].pr);
            var mins=Math.round(dist/1.2);
            var dd=document.createElement('div');dd.className='idist';
            dd.textContent='↓ '+dist+' km · ~'+formatDuration(mins*60);
            body.appendChild(dd);
        }
    });

    if(S.itin.length>1){
        var tot=0;for(var i=0;i<S.itin.length-1;i++)tot+=hav(S.itin[i].pr,S.itin[i+1].pr);
        var totMins=Math.round(tot/1.2);
        var td=document.createElement('div');td.className='itotal';td.id='itinTotal';
        td.textContent='Distance : ~'+tot+' km · ~'+formatDuration(totMins*60);
        body.appendChild(td);
    }

    var rb=document.createElement('button');rb.className='mbtn';rb.textContent='Tracer l\'itinéraire sur la carte';
    rb.onclick=function(){drawRoute();};
    body.appendChild(rb);

    var cb=document.createElement('button');cb.className='mbtn mbtn-outline';cb.style.marginTop='0.3rem';
    cb.textContent='Vider l\'itinéraire';
    cb.onclick=function(){S.itin=[];_saveItin();renderItin();drawRoute();updateItinBadge();document.getElementById('itin').classList.remove('open');};
    body.appendChild(cb);

    drawRoute();
}

window._exportItin=function(mode){
    if(S.itin.length<2){showToast('Ajoutez au moins 2 étapes');return;}
    // Filter stops with valid coordinates
    var valid=S.itin.filter(function(s){return s.pr.la&&s.pr.lo;});
    if(valid.length<2){showToast('Coordonnées GPS manquantes');return;}

    if(mode==='driving'||mode==='walking'){
        // Google Maps Directions API URL format — works on desktop + mobile app
        // Use named waypoints so mobile app shows producer/cheese names instead of "Dropped pin"
        function gmLabel(s){
            var name=s.cn||'';
            var prod=s.pr.n||'';
            // Use producer name if available, otherwise cheese name, with coords as fallback
            var label=prod||name;
            if(label&&label!=='Point de départ') return encodeURIComponent(label)+',France';
            return s.pr.la+','+s.pr.lo;
        }
        var origin=gmLabel(valid[0]);
        var dest=gmLabel(valid[valid.length-1]);
        var tm=mode==='driving'?'driving':'walking';
        var url='https://www.google.com/maps/dir/?api=1&travelmode='+tm+'&origin='+origin+'&destination='+dest;
        if(valid.length>2){
            var wps=[];
            for(var i=1;i<valid.length-1;i++){wps.push(gmLabel(valid[i]));}
            url+='&waypoints='+wps.join('|');
        }
        window.open(url,'_blank');
    }else if(mode==='komoot'){
        // Open Komoot plan page with waypoints
        var kUrl='https://www.komoot.com/plan/@'+valid[0].pr.la+','+valid[0].pr.lo+',12z?sport=touringbicycle';
        valid.forEach(function(s,i){
            var prefix=i===0?'&start=':'&wp=';
            kUrl+=prefix+s.pr.la+'%2C'+s.pr.lo;
        });
        window.open(kUrl,'_blank');
    }
};

function formatDuration(secs){
    var h=Math.floor(secs/3600);var m=Math.round((secs%3600)/60);
    if(h>0)return h+'h'+('0'+m).slice(-2);
    return m+' min';
}

function drawRoute(){
    S.routeL.clearLayers();
    if(S.itin.length<1)return;

    S.itin.forEach(function(stop,i){
        if(!stop.pr.la||!stop.pr.lo)return;
        var ic=L.divIcon({
            html:'<div style="width:28px;height:28px;border-radius:50%;background:#8B6F47;color:#fff;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.2);">'+(i+1)+'</div>',
            iconSize:[28,28],className:''
        });
        L.marker([stop.pr.la,stop.pr.lo],{icon:ic}).addTo(S.routeL).bindPopup((i+1)+'. '+stop.pr.n+'<br><span style="color:#999;">'+stop.cn+'</span>');
    });

    if(S.itin.length<2)return;

    var coords=S.itin.map(function(s){return s.pr.lo+','+s.pr.la;}).join(';');
    var osrmUrl='https://router.project-osrm.org/route/v1/driving/'+coords+'?overview=full&geometries=geojson';

    var ctrl=new AbortController();setTimeout(function(){ctrl.abort();},8000);
    fetch(osrmUrl,{signal:ctrl.signal}).then(function(r){return r.json();}).then(function(data){
        if(data.code==='Ok'&&data.routes&&data.routes.length>0){
            var route=data.routes[0];
            L.geoJSON(route.geometry,{style:{color:'#8B6F47',weight:4,opacity:0.7,dashArray:'8,6'}}).addTo(S.routeL);
            var bounds=L.geoJSON(route.geometry).getBounds();
            S.map.fitBounds(bounds,{padding:[50,50]});
            var td=document.getElementById('itinTotal');
            if(td&&route.distance&&route.duration){
                var km=Math.round(route.distance/1000);
                td.textContent='Distance : '+km+' km · '+formatDuration(route.duration);
            }
        }else{drawStraightLines();}
    }).catch(function(){
        drawStraightLines();
        // OSRM timeout feedback
        var td=document.getElementById('itinTotal');
        if(td)td.textContent+=(' (tracé simplifié — serveur indisponible)');
    });
}

function drawStraightLines(){
    var pts=S.itin.map(function(s){return[s.pr.la,s.pr.lo];});
    L.polyline(pts,{color:'#8B6F47',weight:3,opacity:0.6,dashArray:'6,8'}).addTo(S.routeL);
    S.map.fitBounds(L.polyline(pts).getBounds(),{padding:[50,50]});
}

function hav(a,b){
    if(!a||!b||!a.la||!a.lo||!b.la||!b.lo)return 0;
    var R=6371,dLat=(b.la-a.la)*Math.PI/180,dLon=(b.lo-a.lo)*Math.PI/180;
    var x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a.la*Math.PI/180)*Math.cos(b.la*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return Math.round(R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)));
}

window._clearItin=function(){S.itin=[];_saveItin();S.routeL.clearLayers();document.getElementById('itin').classList.remove('open');updateItinBadge();};
window._toggleDesktopFavs=function(){
    S.showFavs=!S.showFavs;
    var btn=document.getElementById('navFavBtn');
    if(btn)btn.classList.toggle('active',S.showFavs);
    window._view('grid');
};
window._toggleItin=function(){
    var el=document.getElementById('itin');
    if(el.classList.contains('open')){el.classList.remove('open');}
    else{el.classList.add('open');renderItin();drawRoute();}
};
function updateItinBadge(){
    if(window._updateTabBadge) window._updateTabBadge();
    var badge=document.getElementById('itinBadge');
    var tip=document.getElementById('itinTip');
    if(!badge)return;
    var count=S.itin?S.itin.filter(function(s){return !s.isGeo;}).length:0;
    if(count>0){
        badge.textContent=count;badge.classList.add('has-items');
        if(tip)tip.classList.remove('show');
    }else{
        badge.textContent='';badge.classList.remove('has-items');
        if(tip)tip.classList.add('show');
    }
}

// ── MAP CONTROLS ──
function addGeoCtrl(){
    var C=L.Control.extend({
        options:{position:'topleft'},
        onAdd:function(){
            var btn=L.DomUtil.create('div');btn.className='mctrl';
            btn.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B6F47" stroke-width="2.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>';
            btn.title='Ma position';
            L.DomEvent.disableClickPropagation(btn);
            L.DomEvent.on(btn,'click',function(){doGeolocate();});
            return btn;
        }
    });
    S.map.addControl(new C());
}

function doGeolocate(){
    if(!navigator.geolocation){alert('Géolocalisation non disponible.');return;}
    navigator.geolocation.getCurrentPosition(function(pos){
        var lat=pos.coords.latitude,lon=pos.coords.longitude;
        S.userLoc={lat:lat,lon:lon};
        if(S.geoMarker)S.map.removeLayer(S.geoMarker);
        S.geoMarker=L.circleMarker([lat,lon],{radius:10,fillColor:'#2196F3',color:'#fff',weight:3,opacity:1,fillOpacity:0.9}).addTo(S.map);
        S.geoMarker.bindPopup('Vous êtes ici').openPopup();
        S.map.setView([lat,lon],6);
    },function(err){
        console.warn('Géoloc:',err.message);
    },{enableHighAccuracy:true,timeout:10000});
}

function addZoneCtrl(){
    var C=L.Control.extend({
        options:{position:'topright'},
        onAdd:function(){
            var btn=L.DomUtil.create('button');btn.className='ztoggle';
            btn.textContent='Zones de production';
            L.DomEvent.disableClickPropagation(btn);
            L.DomEvent.on(btn,'click',function(){
                S.zoneOn=!S.zoneOn;btn.classList.toggle('active');
                if(S.zoneOn){if(S.map.getZoom()<ZT)drawZones();else drawLocal();}
                else{S.zoneL.clearLayers();S.localL.clearLayers();}
            });
            return btn;
        }
    });
    S.map.addControl(new C());
}

function addLegend(){
    var C=L.Control.extend({
        options:{position:'bottomright'},
        onAdd:function(){
            var d=L.DomUtil.create('div');d.className='mleg';
            d.innerHTML='<div class="mleg-t">Légende</div>'+
            '<div class="mleg-i"><span class="mleg-d" style="background:#8B6F47;font-size:9px;line-height:1;">'+CHEESE_EMOJI+'</span> Fromage</div>'+
            '<div class="mleg-i"><span class="mleg-d" style="background:#E8836B;">'+HOUSE_SVG.replace('width="13" height="13"','width="8" height="8"')+'</span> Producteur</div>'+
            '<div class="mleg-i"><span class="mleg-d" style="background:#5D4037;">'+FLAG_SVG.replace('width="12" height="12"','width="8" height="8"')+'</span> Commune éponyme</div>'+
            '<div class="mleg-i"><span class="mleg-d" style="background:#66BB6A;"></span> Zone de production</div>';
            L.DomEvent.disableClickPropagation(d);
            return d;
        }
    });
    S.map.addControl(new C());
}

// ── WELCOME PROMPT (combined geoloc + itinerary) ──
function showGeoPrompt(){
    // Skip if user already visited
    try{if(localStorage.getItem('lfb_welcome_seen'))return;}catch(e){}
    var overlay=document.createElement('div');overlay.className='geo-overlay';overlay.id='geoOverlay';
    var box=document.createElement('div');box.className='geo-prompt';
    box.innerHTML='<h3>Bienvenue !</h3>'+
    '<p>Découvrez les fromages français, localisez les producteurs et créez votre itinéraire fromager.</p>'+
    '<div class="geo-prompt-btns" style="flex-direction:column;gap:0.4rem;">'+
    '<button class="mbtn" id="geoYes" style="width:100%;">📍 Me localiser et explorer</button>'+
    '<button class="mbtn mbtn-outline" id="geoItin" style="width:100%;">🗺️ Créer un itinéraire fromager</button>'+
    '<button class="mbtn mbtn-outline" id="geoNo" style="width:100%;border:none;color:#999;font-size:0.8rem;">Explorer la carte directement</button>'+
    '</div>';
    document.body.appendChild(overlay);document.body.appendChild(box);
    document.getElementById('geoYes').onclick=function(){
        closeGeoPrompt();doGeolocate();renderItin();
    };
    document.getElementById('geoItin').onclick=function(){
        closeGeoPrompt();setTimeout(function(){window._openItinGen();},150);
    };
    document.getElementById('geoNo').onclick=function(){closeGeoPrompt();};
    overlay.onclick=function(){closeGeoPrompt();};
}
function closeGeoPrompt(){
    try{localStorage.setItem('lfb_welcome_seen','1');}catch(e){}
    var o=document.getElementById('geoOverlay');if(o)o.remove();
    var p=document.querySelector('.geo-prompt');if(p)p.remove();
}

// ── EVENTS ──
['fAnimal','fLabel','fRegion','fPate','fSaison','fGout'].forEach(function(id){document.getElementById(id).addEventListener('change',applyF);});
document.getElementById('fBio').addEventListener('change',applyF);
document.getElementById('fMonastic').addEventListener('change',applyF);
document.getElementById('fEponyme').addEventListener('change',applyF);

// ── AUTOCOMPLETE ──
var sugBox=document.getElementById('searchSuggest');
var sugHL=-1; // highlighted index
var sugItems=[]; // current suggestion DOM elements

function updateSuggestions(){
    var q=N(document.getElementById('searchInput').value);
    sugBox.innerHTML='';sugItems=[];sugHL=-1;
    if(!q||q.length<2||!S.data){sugBox.classList.remove('active');applyF();return;}

    // Find matches: cheese names, regions, animal types
    var matches=[];
    var seen=new Set();
    // 1) Cheese names matching
    S.data.cheeses.forEach(function(c,i){
        if(N(c.nm).indexOf(q)>-1&&!seen.has(c.nm)){
            seen.add(c.nm);
            matches.push({type:'cheese',nm:c.nm,sub:c.lb||c.an||'',idx:i});
        }
    });
    // 2) Region matches
    var rgSet=new Set();
    S.data.cheeses.forEach(function(c){
        if(c.rg)c.rg.forEach(function(r){
            if(N(r).indexOf(q)>-1&&!rgSet.has(r)){rgSet.add(r);matches.push({type:'region',nm:r,sub:'Région'});}
        });
    });
    // 3) Animal matches
    var anSet=new Set();
    S.data.cheeses.forEach(function(c){
        if(c.an&&N(c.an).indexOf(q)>-1&&!anSet.has(c.an)){anSet.add(c.an);matches.push({type:'animal',nm:c.an,sub:'Espèce'});}
    });

    if(matches.length===0){sugBox.classList.remove('active');applyF();return;}

    // Limit to 8 suggestions
    matches=matches.slice(0,8);
    matches.forEach(function(m,i){
        var div=document.createElement('div');div.className='sug-item';
        // Highlight matching text
        var nameHtml=highlightMatch(m.nm,q);
        var icon=m.type==='cheese'?'🧀 ':m.type==='region'?'📍 ':'';
        div.innerHTML='<span>'+icon+'</span><div><div class="sug-name">'+nameHtml+'</div><div class="sug-sub">'+m.sub+'</div></div>';
        div.onmousedown=function(e){e.preventDefault();selectSuggestion(m);};
        sugBox.appendChild(div);
        sugItems.push(div);
    });
    S._sugData=matches;
    sugBox.classList.add('active');
    // Also apply filter while showing suggestions
    applyF();
}

function highlightMatch(text,q){
    var lower=N(text);
    var pos=lower.indexOf(q);
    if(pos===-1)return text;
    // Find the corresponding position in the original text
    // Since N() strips accents, we need to match character by character
    var origPos=0,normCount=0;
    for(var k=0;k<text.length&&normCount<pos;k++){
        var ch=text[k].normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        normCount+=ch.length;
        origPos=k+1;
    }
    var endPos=origPos;normCount=0;
    for(var k2=origPos;k2<text.length&&normCount<q.length;k2++){
        var ch2=text[k2].normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        normCount+=ch2.length;
        endPos=k2+1;
    }
    return text.substring(0,origPos)+'<em>'+text.substring(origPos,endPos)+'</em>'+text.substring(endPos);
}

function selectSuggestion(m){
    sugBox.classList.remove('active');sugBox.innerHTML='';
    if(m.type==='cheese'){
        // Navigate to this specific cheese
        document.getElementById('searchInput').value=m.nm;
        applyF();
        window._focus(m.idx);
    }else if(m.type==='region'){
        document.getElementById('searchInput').value='';
        document.getElementById('fRegion').value=m.nm;
        applyF();
    }else if(m.type==='animal'){
        document.getElementById('searchInput').value='';
        document.getElementById('fAnimal').value=m.nm;
        applyF();
    }
}

document.getElementById('searchInput').addEventListener('input',updateSuggestions);
document.getElementById('searchInput').addEventListener('focus',function(){
    if(this.value.length>=2)updateSuggestions();
});
document.getElementById('searchInput').addEventListener('blur',function(){
    setTimeout(function(){sugBox.classList.remove('active');},200);
});
document.getElementById('searchInput').addEventListener('keydown',function(e){
    if(!sugBox.classList.contains('active')||sugItems.length===0)return;
    if(e.key==='ArrowDown'){
        e.preventDefault();
        sugHL=Math.min(sugHL+1,sugItems.length-1);
        sugItems.forEach(function(el,i){el.classList.toggle('highlighted',i===sugHL);});
    }else if(e.key==='ArrowUp'){
        e.preventDefault();
        sugHL=Math.max(sugHL-1,0);
        sugItems.forEach(function(el,i){el.classList.toggle('highlighted',i===sugHL);});
    }else if(e.key==='Enter'){
        e.preventDefault();
        if(sugHL>=0&&S._sugData&&S._sugData[sugHL]){
            selectSuggestion(S._sugData[sugHL]);
        }
    }
});

// ── KEYBOARD ──
document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
        if(sugBox.classList.contains('active')){sugBox.classList.remove('active');return;}
        if(S.focus!==null)window._closeDetail();
        window._closeFilterSheet();
    }
});

// ── INIT ──
try{
    initFilterToggle();
    initMap();setTimeout(loadData,0);
    // Restore saved itinerary from localStorage
    _loadItin();
    if(S.itin.length>0){
        setTimeout(function(){drawRoute();updateItinBadge();},1200);
    }
    // Ensure map tiles + padding after layout settles
    setTimeout(function(){setTopPadding();S.map.invalidateSize();},100);
    setTimeout(function(){setTopPadding();S.map.invalidateSize();},500);
    // Show geoloc prompt after a short delay
    setTimeout(showGeoPrompt,800);
}catch(e){
    console.error('Init:',e);
    document.getElementById('map').innerHTML='<div style="padding:2rem;text-align:center;color:#888;"><h2>Erreur</h2><p>'+e.message+'</p></div>';
}
// ── PAGE NAVIGATION ──
window._openPage=function(page){
    track('page_open',{page:page});
    if(page==='about'){
        window.location.href='about.html';
    }else if(page==='contact'){
        window.location.href='contact.html';
    }else if(page==='definitions'){
        window.location.href='definition.html';
    }else if(page==='suggest'){
        var el=document.getElementById('pageSuggest');
        if(el){el.classList.add('active');document.body.style.overflow='hidden';}
    }
};
window._closePage=function(){
    document.querySelectorAll('.page-overlay.active').forEach(function(el){el.classList.remove('active');});
    document.body.style.overflow='';
};
window._goHome=function(){
    document.getElementById('pageAbout').classList.remove('active');
    document.getElementById('homeBtn').classList.remove('visible');
};
window._sendSuggestion=function(form){
    var fd=new FormData(form);
    var fromage=fd.get('fromage')||'';
    var region=fd.get('region')||'';
    var details=fd.get('details')||'';
    track('cheese_suggestion',{fromage:fromage,region:region,has_details:details?'yes':'no'});
    var subject='Suggestion de fromage : '+fromage;
    var body='Fromage : '+fromage+'\nRégion : '+region+'\n\nDétails :\n'+details;
    window.location.href='mailto:lesfromagesdubonheur@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    window._closePage();
};
// Mobile menu (legacy - kept for compatibility)
window._openMobMenu=function(){};
window._closeMobMenu=function(){};

// Mobile bottom tab bar
window._mobTab=function(tab){
    // Update active state
    var tabs=document.querySelectorAll('.mob-tab');
    tabs.forEach(function(t){t.classList.remove('active');});

    if(tab==='map'){
        document.getElementById('tabCarte').classList.add('active');
        window._view('map');
        window._closeMobPlus();
    }else if(tab==='grid'){
        document.getElementById('tabFromages').classList.add('active');
        window._view('grid');
        window._closeMobPlus();
    }else if(tab==='itin'){
        document.getElementById('tabItin').classList.add('active');
        window._view('map');
        window._toggleItin();
        window._closeMobPlus();
    }else if(tab==='fav'){
        document.getElementById('tabFav').classList.add('active');
        S.showFavs=true;
        window._view('grid');
        window._closeMobPlus();
    }else if(tab==='plus'){
        document.getElementById('tabPlus').classList.add('active');
        document.getElementById('mobPlusMenu').classList.add('open');
        document.getElementById('mobPlusOverlay').classList.add('open');
    }
};
window._closeMobPlus=function(){
    document.getElementById('mobPlusMenu').classList.remove('open');
    document.getElementById('mobPlusOverlay').classList.remove('open');
    // Restore active tab based on current view
    var tabs=document.querySelectorAll('.mob-tab');
    tabs.forEach(function(t){t.classList.remove('active');});
    if(S.currentView==='grid'){if(S.showFavs) document.getElementById('tabFav').classList.add('active');else document.getElementById('tabFromages').classList.add('active');}
    else document.getElementById('tabCarte').classList.add('active');
};
// Update itinerary badge on tab bar
window._updateTabBadge=function(){
    var cnt=S.itin?S.itin.filter(function(s){return !s.isGeo;}).length:0;
    var badge=document.getElementById('tabItinBadge');
    if(badge){
        badge.textContent=cnt;
        badge.classList.toggle('has-items',cnt>0);
    }
};
// ── Desktop dropdown menus ──
(function(){
    document.querySelectorAll('.nav-dropdown').forEach(function(dd){
        var btn=dd.querySelector('.nav-drop-btn');
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var wasOpen=dd.classList.contains('open');
            document.querySelectorAll('.nav-dropdown.open').forEach(function(d){d.classList.remove('open');});
            if(!wasOpen)dd.classList.add('open');
        });
    });
    document.addEventListener('click',function(){
        document.querySelectorAll('.nav-dropdown.open').forEach(function(d){d.classList.remove('open');});
    });
})();
document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){window._closePage();window._goHome();window._closeMobMenu();window._closeItinGen();document.querySelectorAll('.nav-dropdown.open').forEach(function(d){d.classList.remove('open');});}
});

// ── ITINERARY GENERATOR (popup wizard) ──
var ITIN_CITIES={
    'paris':{la:48.8566,lo:2.3522},'lyon':{la:45.7640,lo:4.8357},
    'marseille':{la:43.2965,lo:5.3698},'toulouse':{la:43.6047,lo:1.4442},
    'nice':{la:43.7102,lo:7.2620},'nantes':{la:47.2184,lo:-1.5536},
    'strasbourg':{la:48.5734,lo:7.7521},'montpellier':{la:43.6108,lo:3.8767},
    'bordeaux':{la:44.8378,lo:-0.5792},'lille':{la:50.6292,lo:3.0573},
    'rennes':{la:48.1173,lo:-1.6778},'reims':{la:49.2583,lo:3.0440},
    'dijon':{la:47.3220,lo:5.0415},'grenoble':{la:45.1885,lo:5.7245},
    'clermont-ferrand':{la:45.7772,lo:3.0870},'tours':{la:47.3941,lo:0.6848},
    'annecy':{la:45.8992,lo:6.1294},'besancon':{la:47.2378,lo:6.0241},
    'rouen':{la:49.4432,lo:1.0993},'caen':{la:49.1829,lo:-0.3707},
    'limoges':{la:45.8336,lo:1.2611},'pau':{la:43.2951,lo:-0.3708},
    'aurillac':{la:44.9308,lo:2.4447},'rodez':{la:44.3497,lo:2.5754},
    'metz':{la:49.1193,lo:6.1757},'nancy':{la:48.6921,lo:6.1844},
    'colmar':{la:48.0794,lo:7.3580},'brest':{la:48.3904,lo:-4.4861}
};
var igSel={locType:'',lat:0,lon:0,dur:'',radius:150,maxStops:6,trans:'en voiture',prefs:[]};
var igStep=0;
// Populate city datalist
(function(){
    var dl=document.getElementById('igCityList');
    if(!dl)return;
    Object.keys(ITIN_CITIES).sort().forEach(function(c){
        var o=document.createElement('option');o.value=c.charAt(0).toUpperCase()+c.slice(1);dl.appendChild(o);
    });
})();

window._openItinGen=function(){
    track('itinerary_start');
    var m=document.getElementById('itinGenModal');if(m)m.style.display='flex';
    // Full state reset
    igStep=0;
    igSel={locType:'',lat:0,lon:0,dur:'',radius:150,maxStops:6,trans:'en voiture',prefs:[]};
    // Clear all selected states in UI
    m.querySelectorAll('.selected').forEach(function(el){el.classList.remove('selected');});
    m.querySelectorAll('.ig-city-input').forEach(function(el){el.value='';el.classList.remove('visible');});
    _igShowStep(0);
};
window._closeItinGen=function(){
    var m=document.getElementById('itinGenModal');if(m)m.style.display='none';
    try{localStorage.setItem('lfb_itin_seen','1');}catch(e){}
    // Auto-save generated itinerary if exists and not yet applied
    if(window._igRoute&&window._igRoute.length>0&&S.itin.length===0){
        S.itin=[];
        window._igRoute.forEach(function(s){
            S.itin.push({pr:{n:s.name,la:s.lat,lo:s.lon,b:!!s.bio},cn:s.cheese});
        });
        _saveItin();renderItin();drawRoute();updateItinBadge();
    }
};
// Auto-open itinerary: now handled by welcome prompt
window._maybeAutoOpenItin=function(){
    // Combined into showGeoPrompt() — no separate popup
};
window._igSelectLoc=function(btn,type){
    document.querySelectorAll('#itinGenModal .ig-loc-btn').forEach(function(b){b.classList.remove('selected');});
    btn.classList.add('selected');
    igSel.locType=type;
    var ci=document.getElementById('igCityInput');
    if(type==='city'){ci.classList.add('visible');ci.focus();}
    else{
        ci.classList.remove('visible');
        if(S.userLoc){igSel.lat=S.userLoc.lat;igSel.lon=S.userLoc.lon;setTimeout(function(){_igShowStep(1);},350);}
        else if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(function(pos){
                igSel.lat=pos.coords.latitude;igSel.lon=pos.coords.longitude;
                setTimeout(function(){_igShowStep(1);},200);
            },function(){igSel.lat=48.8566;igSel.lon=2.3522;setTimeout(function(){_igShowStep(1);},200);});
        }else{igSel.lat=48.8566;igSel.lon=2.3522;setTimeout(function(){_igShowStep(1);},350);}
    }
};
window._igSelectPill=function(el){
    el.parentElement.querySelectorAll('.ig-pill').forEach(function(p){p.classList.remove('selected');});
    el.classList.add('selected');
    if(el.dataset.dur){igSel.dur=el.dataset.dur;igSel.radius=parseInt(el.dataset.radius)||80;igSel.maxStops=parseInt(el.dataset.stops)||5;}
    if(el.dataset.trans){igSel.trans=el.dataset.trans;}
    // Auto-advance after brief visual feedback (steps 1=duration, 2=transport)
    if(igStep<3){setTimeout(function(){_igShowStep(igStep+1);},350);}
};
// Auto-advance from city input: on Enter or datalist selection
(function(){
    var ci=document.getElementById('igCityInput');
    if(!ci)return;
    ci.addEventListener('keydown',function(e){
        if(e.key==='Enter'){e.preventDefault();if(ci.value.trim())setTimeout(function(){_igShowStep(1);},200);}
    });
    ci.addEventListener('change',function(){
        if(ci.value.trim())setTimeout(function(){_igShowStep(1);},300);
    });
})();
window._igTogglePref=function(el){
    el.classList.toggle('selected');
    var p=el.dataset.pref,idx=igSel.prefs.indexOf(p);
    if(idx>=0)igSel.prefs.splice(idx,1);else igSel.prefs.push(p);
};

function _igShowStep(n){
    document.querySelectorAll('#itinGenModal .ig-step, #itinGenModal .ig-result').forEach(function(s){s.classList.remove('active');});
    var footer=document.getElementById('igFooter');
    var btnNext=document.getElementById('igBtnNext');
    var btnBack=document.getElementById('igBtnBack');
    if(n<4){
        document.getElementById('igStep'+n).classList.add('active');
        // Steps 0-2: auto-advance, hide Next. Step 3: show Generate.
        if(n===3){
            btnNext.textContent='Générer mon itinéraire';
            btnNext.className='ig-btn ig-btn-generate';
            btnNext.style.display='';
        }else{
            btnNext.style.display='none';
        }
        // Show footer only if there's a visible button (back or generate)
        footer.style.display=(n>0||n===3)?'flex':'none';
    }else{
        // Show loading spinner, then build result
        var igPanel=document.getElementById('igResult');
        igPanel.innerHTML='<div style="text-align:center;padding:2rem 0;"><div class="ig-spinner"></div><p style="color:#999;font-size:0.82rem;margin-top:0.8rem;">Création de votre itinéraire…</p></div>';
        igPanel.classList.add('active');
        footer.style.display='none';
        setTimeout(function(){_igBuildResult();},80);
    }
    btnBack.style.display=n>0?'':'none';
    // Show footer if back button is visible
    if(n>0&&n<4)footer.style.display='flex';
    igStep=n;
    // Scroll modal back to top when navigating
    var modal=document.querySelector('.ig-modal');if(modal)modal.scrollTop=0;
    for(var i=0;i<4;i++){
        var d=document.getElementById('igDot'+i);
        d.classList.remove('active','done');
        if(i<n)d.classList.add('done');else if(i===n)d.classList.add('active');
    }
}
window._igShowStep=_igShowStep; // expose for onclick in result HTML
window._igNext=function(){if(igStep<4)_igShowStep(igStep+1);};
window._igBack=function(){if(igStep>0)_igShowStep(igStep-1);};

function _igMatchesPref(cheese,prefs){
    if(!prefs||!prefs.length)return true;
    // Group prefs by category: animal and goût use OR logic within group, others use AND
    var animalPrefs=[],goutPrefs=[],otherPrefs=[];
    for(var pi=0;pi<prefs.length;pi++){
        var pf=prefs[pi];
        if(pf==='chevre'||pf==='brebis')animalPrefs.push(pf);
        else if(pf==='doux'||pf==='equilibre'||pf==='intense'||pf==='puissant')goutPrefs.push(pf);
        else otherPrefs.push(pf);
    }
    // Animal: OR logic — cheese must match at least one selected animal
    if(animalPrefs.length>0){
        var animalOk=false;
        for(var ai=0;ai<animalPrefs.length;ai++){
            if(animalPrefs[ai]==='chevre'&&cheese.an&&cheese.an.indexOf('Chèvre')>=0){animalOk=true;break;}
            if(animalPrefs[ai]==='brebis'&&cheese.an&&cheese.an.indexOf('Brebis')>=0){animalOk=true;break;}
        }
        if(!animalOk)return false;
    }
    // Goût: OR logic — cheese must match at least one selected goût
    if(goutPrefs.length>0){
        var goutOk=false;
        var goutMap={doux:'Doux',equilibre:'Equilibré',intense:'Intense',puissant:'Puissant'};
        for(var gi=0;gi<goutPrefs.length;gi++){
            if(cheese.go&&cheese.go===goutMap[goutPrefs[gi]]){goutOk=true;break;}
        }
        if(!goutOk)return false;
    }
    // Others (aop, monastique): AND logic
    for(var oi=0;oi<otherPrefs.length;oi++){
        var op=otherPrefs[oi];
        if(op==='aop'&&(!cheese.ao||(!cheese.ao.da&&!cheese.ao.dc_aoc&&!cheese.ao.di)))return false;
        if(op==='monastique'&&!isMonastic(cheese))return false;
        // bio is checked at producer level in _igFindCandidates
    }
    return true;
}

function _igFindCandidates(radius){
    var candidates=[];
    var prefs=igSel.prefs;
    S.data.cheeses.forEach(function(cheese){
        if(!cheese.pr||!cheese.pr.length)return;
        if(!_igMatchesPref(cheese,prefs))return;
        cheese.pr.forEach(function(p){
            if(!p.la||!p.lo)return;
            if(prefs.indexOf('bio')>=0&&!p.b)return;
            var dist=_haversine(igSel.lat,igSel.lon,p.la,p.lo);
            if(dist<=radius){
                candidates.push({name:p.n,cheese:cheese.nm,lat:p.la,lon:p.lo,dist:dist,
                    bio:p.b,aop:!!(cheese.ao&&(cheese.ao.da||cheese.ao.dc_aoc||cheese.ao.di)),
                    monastique:isMonastic(cheese),label:cheese.lb||'',gout:cheese.go||'',pate:cheese.tp||'',animal:cheese.an||''});
            }
        });
    });
    return candidates;
}

function _igBuildResult(){
    if(!S.data)return;
    var city='';
    if(igSel.locType==='city'){
        city=document.getElementById('igCityInput').value||'Votre ville';
        var key=city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
        if(ITIN_CITIES[key]){igSel.lat=ITIN_CITIES[key].la;igSel.lon=ITIN_CITIES[key].lo;}
        else{igSel.lat=46.6;igSel.lon=2.5;}
    }else{city='Ma position';}

    // Radius & max expansion: distance from start (one-way), kept realistic for round trip
    var IG_RADII={
        'Demi-journée':{'en voiture':[40,80],'à vélo':[15,30],'à pied':[5,10]},
        'Journée':     {'en voiture':[60,120],'à vélo':[25,50],'à pied':[8,18]},
        'Week-end':    {'en voiture':[100,200],'à vélo':[40,100],'à pied':[15,40]},
        'Vacances':    {'en voiture':[150,400],'à vélo':[80,200],'à pied':[25,75]}
    };
    var rEntry=(IG_RADII[igSel.dur]||{})[igSel.trans]||[200,600];
    var baseR=rEntry[0],maxR=rEntry[1];
    var minStops=3;
    var candidates=[];
    var usedRadius=baseR;
    // Progressive expansion from baseR to maxR
    var steps=[baseR, Math.round((baseR+maxR)/2), maxR];
    for(var mi=0;mi<steps.length;mi++){
        usedRadius=steps[mi];
        candidates=_igFindCandidates(usedRadius);
        var uniq={};candidates.forEach(function(c){uniq[c.cheese]=true;});
        if(Object.keys(uniq).length>=minStops)break;
    }

    var panel=document.getElementById('igResult');
    if(candidates.length===0){
        panel.innerHTML='<div class="ig-no-result"><div class="ig-no-icon">🧭</div>'+
            '<h3>Pas encore d\'itinéraire disponible</h3>'+
            '<p>Même en élargissant la recherche, nous n\'avons pas trouvé assez de producteurs avec ces critères.<br><br>'+
            'Essayez de modifier vos préférences ou votre point de départ.</p>'+
            '<button class="ig-back-btn" onclick="window._igShowStep(3)">Modifier mes préférences</button>'+
            '<button class="ig-back-btn" onclick="window._igShowStep(1)">Changer la durée</button>'+
            '<button class="ig-back-btn" onclick="window._igShowStep(0)">Changer le point de départ</button></div>';
        track('itinerary_no_result',{city:city,transport:igSel.trans,duration:igSel.dur,prefs:igSel.prefs.join(',')});
        return;
    }
    var expanded=(usedRadius>baseR);

    candidates.sort(function(a,b){return a.dist-b.dist;});
    // Deduplicate by producer: group cheeses per producer, one stop per producer
    var selected=[],usedProducers={},usedCheeses={};
    candidates.forEach(function(c){
        if(selected.length>=igSel.maxStops&&!usedProducers[c.name])return;
        if(usedCheeses[c.cheese])return;
        usedCheeses[c.cheese]=true;
        if(usedProducers[c.name]){
            // Same producer already selected — append cheese to existing stop
            var existing=usedProducers[c.name];
            existing.cheese+=', '+c.cheese;
        }else if(selected.length<igSel.maxStops){
            usedProducers[c.name]=c;
            selected.push(c);
        }
    });
    // Nearest-neighbor ordering
    if(selected.length>1){
        var ordered=[selected[0]],remaining=selected.slice(1);
        while(remaining.length>0){
            var last=ordered[ordered.length-1],bestIdx=0,bestDist=Infinity;
            remaining.forEach(function(r,i){var d=_haversine(last.lat,last.lon,r.lat,r.lon);if(d<bestDist){bestDist=d;bestIdx=i;}});
            ordered.push(remaining[bestIdx]);remaining.splice(bestIdx,1);
        }
        selected=ordered;
    }

    var html='<div class="ig-result-header"><h3>Votre tournée fromage</h3>'+
        '<p>'+selected.length+' étapes · '+igSel.dur+' '+igSel.trans+' depuis '+city+'</p>'+
        (expanded?'<p style="font-size:0.72rem;color:#C67A4A;margin-top:0.3rem;">Itinéraire ambitieux — rayon élargi à ~'+usedRadius+' km pour plus de découvertes</p>':'')+
        '</div>';
    // Show starting point as first visual step
    html+='<div class="ig-stop" style="opacity:0.7;">'+
        '<div class="ig-stop-num" style="background:#C67A4A;">📍</div><div class="ig-stop-info">'+
        '<div class="ig-stop-name">'+city+'</div>'+
        '<div class="ig-stop-cheese" style="color:#999;">Point de départ</div>'+
        '</div></div>';
    var totalDist=0;
    selected.forEach(function(s,i){
        var badges='';
        if(s.aop)badges+=' <span class="ig-badge ig-b-aop">AOP</span>';
        if(s.bio)badges+=' <span class="ig-badge ig-b-bio">Bio</span>';
        if(s.monastique)badges+=' <span class="ig-badge" style="background:#EDE7F6;color:#6A1B9A;">Monastique</span>';
        var detail='<span style="font-size:0.68rem;color:#999;">'+[s.animal,s.pate,s.gout].filter(function(x){return x&&x!=='-'&&x!=='Non précisé';}).join(' · ')+'</span>';
        var distText;
        if(i===0){distText='↓ '+Math.round(s.dist)+' km';}
        else{var seg=_haversine(selected[i-1].lat,selected[i-1].lon,s.lat,s.lon);totalDist+=seg;
            distText=igSel.trans==='à pied'?'↓ '+seg.toFixed(1)+' km':'↓ '+Math.round(seg)+' km';}
        html+='<div class="ig-stop" style="position:relative;">'+
            '<div class="ig-stop-num">'+(i+1)+'</div><div class="ig-stop-info">'+
            '<div class="ig-stop-name">'+s.name+badges+'</div>'+
            '<div class="ig-stop-cheese">'+s.cheese+'</div>'+
            '<div>'+detail+'</div>'+
            '<div class="ig-stop-dist">'+distText+'</div></div>'+
            '<span style="position:absolute;top:0.4rem;right:0.3rem;cursor:pointer;color:#ccc;font-size:0.75rem;" onclick="window._igRemoveStop('+i+')" title="Retirer cette étape">✕</span>'+
            '</div>';
    });
    totalDist+=selected[0].dist;
    // Add return distance (last stop back to start)
    var lastStop=selected[selected.length-1];
    var returnDist=_haversine(lastStop.lat,lastStop.lon,igSel.lat,igSel.lon);
    totalDist+=returnDist;
    html+='<div class="ig-total">~'+Math.round(totalDist)+' km aller-retour · '+igSel.dur+' '+igSel.trans+'</div>';
    html+='<div class="ig-export">';
    html+='<button class="ig-export-btn" onclick="window._igShowOnMap()" style="background:#8B6F47;color:#fff;border-color:#8B6F47;font-weight:500;width:100%;">🗺️ Voir sur la carte</button>';
    html+='</div>';
    html+='<button class="ig-back-btn" onclick="window._igShowStep(0)">Modifier mes choix</button>';
    panel.innerHTML=html;

    window._igRoute=selected;window._igCity=city;
    track('itinerary_generated',{city:city,transport:igSel.trans,duration:igSel.dur,stops:selected.length,prefs:igSel.prefs.join(',')});
}

window._igExportGM=function(){
    if(!window._igRoute||!window._igRoute.length)return;
    var stops=window._igRoute.filter(function(s){return s.lat&&s.lon;});
    if(!stops.length)return;
    var origin=igSel.lat+','+igSel.lon;
    var last=stops[stops.length-1];
    var dest=last.lat+','+last.lon;
    var url='https://www.google.com/maps/dir/?api=1&travelmode=driving&origin='+origin+'&destination='+dest;
    if(stops.length>1){
        var wps=[];
        for(var i=0;i<stops.length-1;i++){wps.push(stops[i].lat+','+stops[i].lon);}
        url+='&waypoints='+wps.join('|');
    }
    window.open(url,'_blank');
    track('itinerary_export',{type:'google_maps'});
};
window._igExportKomoot=function(){
    if(!window._igRoute||!window._igRoute.length)return;
    var url='https://www.komoot.com/plan/@'+igSel.lat+','+igSel.lon+',12z?sport=touringbicycle';
    url+='&start='+igSel.lat+'%2C'+igSel.lon;
    window._igRoute.forEach(function(s){
        if(s.lat&&s.lon)url+='&wp='+s.lat+'%2C'+s.lon;
    });
    window.open(url,'_blank');
    track('itinerary_export',{type:'komoot'});
};

// Show generated itinerary on the map (close modal, draw route)
window._igShowOnMap=function(){
    if(!window._igRoute||!window._igRoute.length)return;
    // Close the modal
    window._closeItinGen();
    // Clear existing itinerary, add start point + generated stops
    S.itin=[];
    // Add starting city/position as first stop
    if(igSel.lat&&igSel.lon){
        S.itin.push({pr:{n:window._igCity||'Départ',la:igSel.lat,lo:igSel.lon},cn:'Point de départ',isGeo:true});
    }
    window._igRoute.forEach(function(s){
        S.itin.push({pr:{n:s.name,la:s.lat,lo:s.lon,b:!!s.bio},cn:s.cheese});
    });
    _saveItin();renderItin();drawRoute();updateItinBadge();
    document.getElementById('itin').classList.add('open');
    // Fit map to show the route
    if(S.itin.length>1){
        var pts=S.itin.map(function(s){return[s.pr.la,s.pr.lo];});
        S.map.fitBounds(L.polyline(pts).getBounds(),{padding:[50,50]});
    }
    // Switch to map view on mobile
    if(isMobile())window._mobTab('map');
};

// Remove a stop from generated itinerary and rebuild result
window._igRemoveStop=function(idx){
    if(!window._igRoute)return;
    window._igRoute.splice(idx,1);
    if(window._igRoute.length===0){
        _igShowStep(3); // Go back to preferences if all removed
        return;
    }
    // Rebuild the result HTML with updated stops
    var panel=document.getElementById('igResult');
    var city=window._igCity||'';
    var selected=window._igRoute;
    var html='<div class="ig-result-header"><h3>Votre tournée fromage</h3>'+
        '<p>'+selected.length+' étapes · '+igSel.dur+' '+igSel.trans+' depuis '+city+'</p></div>';
    var totalDist=0;
    selected.forEach(function(s,i){
        var badges='';
        if(s.aop)badges+=' <span class="ig-badge ig-b-aop">AOP</span>';
        if(s.bio)badges+=' <span class="ig-badge ig-b-bio">Bio</span>';
        if(s.monastique)badges+=' <span class="ig-badge" style="background:#EDE7F6;color:#6A1B9A;">Monastique</span>';
        var detail='<span style="font-size:0.68rem;color:#999;">'+[s.animal,s.pate,s.gout].filter(function(x){return x&&x!=='-'&&x!=='Non précisé';}).join(' · ')+'</span>';
        var distText;
        if(i===0){distText='Départ · à '+Math.round(s.dist)+' km';}
        else{var seg=_haversine(selected[i-1].lat,selected[i-1].lon,s.lat,s.lon);totalDist+=seg;
            distText='↓ '+Math.round(seg)+' km';}
        html+='<div class="ig-stop" style="position:relative;">'+
            '<div class="ig-stop-num">'+(i+1)+'</div><div class="ig-stop-info">'+
            '<div class="ig-stop-name">'+s.name+badges+'</div>'+
            '<div class="ig-stop-cheese">'+s.cheese+'</div>'+
            '<div>'+detail+'</div>'+
            '<div class="ig-stop-dist">'+distText+'</div></div>'+
            '<span style="position:absolute;top:0.4rem;right:0.3rem;cursor:pointer;color:#ccc;font-size:0.75rem;" onclick="window._igRemoveStop('+i+')" title="Retirer cette étape">✕</span>'+
            '</div>';
    });
    totalDist+=selected[0].dist;
    var lastS=selected[selected.length-1];
    var retD=_haversine(lastS.lat,lastS.lon,igSel.lat,igSel.lon);
    totalDist+=retD;
    html+='<div class="ig-total">~'+Math.round(totalDist)+' km aller-retour · '+igSel.dur+' '+igSel.trans+'</div>';
    html+='<div class="ig-export">';
    html+='<button class="ig-export-btn" onclick="window._igShowOnMap()" style="background:#8B6F47;color:#fff;border-color:#8B6F47;font-weight:500;width:100%;">🗺️ Voir sur la carte</button>';
    html+='</div>';
    html+='<button class="ig-back-btn" onclick="window._igShowStep(0)">Modifier mes choix</button>';
    panel.innerHTML=html;
};

})();


// Anti-scraping protections
document.addEventListener('contextmenu',function(e){
    if(e.target.closest('.detail,.ccard,.prlist,.dgrid')){e.preventDefault();}
});
console.log('%c⚠️ Les données de ce site sont protégées. Toute extraction automatisée est interdite.','font-size:16px;color:red;font-weight:bold;');