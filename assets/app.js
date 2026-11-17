(function(){
  "use strict";
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

  // mobil meny
  var mb=$(".menu-btn"), nav=$('nav[aria-label="Hovedmeny"]');
  if(mb&&nav){mb.addEventListener("click",function(){var o=nav.classList.toggle("open");mb.setAttribute("aria-expanded",o)});}

  // video-popup
  var dlg=$("#video-dialog"), frame=$("#video-frame"), vt=$("#video-title"), yt=$("#video-yt"), lastBtn=null;
  function openVideo(id,title,btn){
    lastBtn=btn||null;
    vt.textContent=title||"Video";
    yt.href="https://youtu.be/"+id;
    frame.src="https://www.youtube-nocookie.com/embed/"+id+"?autoplay=1&rel=0&hl=nb";
    if(typeof dlg.showModal==="function"){dlg.showModal();}else{dlg.setAttribute("open","")}
    $("#video-close").focus();
  }
  function closeVideo(){
    frame.src="about:blank";
    if(dlg.open){dlg.close();}
    if(lastBtn){lastBtn.focus();}
  }
  document.addEventListener("click",function(e){
    var b=e.target.closest("[data-vid]");
    if(b&&!b.closest("dialog")){e.preventDefault();openVideo(b.getAttribute("data-vid"),b.getAttribute("data-title"),b);}
  });
  if(dlg){
    $("#video-close").addEventListener("click",closeVideo);
    dlg.addEventListener("close",function(){frame.src="about:blank"});
    dlg.addEventListener("click",function(e){if(e.target===dlg){closeVideo();}});
  }

  // bilde-popup
  var idlg=$("#img-dialog"), ibig=$("#img-big"), icap=$("#img-cap"), ilast=null;
  document.addEventListener("click",function(e){
    var b=e.target.closest(".img-btn");
    if(b&&idlg){e.preventDefault();ilast=b;ibig.src=b.getAttribute("data-full");ibig.alt=b.getAttribute("data-alt")||"";icap.textContent=b.getAttribute("data-alt")||"";
      if(typeof idlg.showModal==="function"){idlg.showModal();}else{idlg.setAttribute("open","")}
      $("#img-close").focus();}
  });
  if(idlg){
    $("#img-close").addEventListener("click",function(){idlg.close();if(ilast)ilast.focus();});
    idlg.addEventListener("click",function(e){if(e.target===idlg){idlg.close();}});
    idlg.addEventListener("close",function(){ibig.src="";});
  }

  // innholdsfortegnelse mobil
  var tt=$(".toc-toggle"), tb=$("#toc-body");
  if(tt&&tb){tt.addEventListener("click",function(){var o=tb.classList.toggle("open");tt.setAttribute("aria-expanded",o)});}

  // åpne/lukk alle
  var ea=$("#expand-all"), ca=$("#collapse-all");
  if(ea){ea.addEventListener("click",function(){$$("details.full").forEach(function(d){d.open=true})});}
  if(ca){ca.addEventListener("click",function(){$$("details.full").forEach(function(d){d.open=false})});}

  // åpne seksjon når man hopper til den via lenke/hash
  function openHash(){
    if(!location.hash)return;
    var el=document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if(el){var d=$("details.full",el);if(d)d.open=true;}
  }
  window.addEventListener("hashchange",openHash);openHash();

  // aktiv seksjon i innholdsfortegnelsen
  var tocLinks=$$(".toc li a");
  if(tocLinks.length&&"IntersectionObserver" in window){
    var map={};tocLinks.forEach(function(a){map[a.getAttribute("href").slice(1)]=a});
    var io=new IntersectionObserver(function(es){
      es.forEach(function(en){
        if(en.isIntersecting){
          tocLinks.forEach(function(a){a.classList.remove("active");a.removeAttribute("aria-current")});
          var a=map[en.target.id];if(a){a.classList.add("active");a.setAttribute("aria-current","true");}
        }
      });
    },{rootMargin:"-90px 0px -70% 0px"});
    $$(".section-card").forEach(function(s){io.observe(s)});
  }

  // videoside: filter
  var vg=$(".vgrid-page");
  if(vg){
    var cards=$$(".vcard",vg), btns=$$(".f-btn"), q=$("#vq"), cnt=$("#v-count"), mod="all";
    var run=function(){
      var t=(q.value||"").toLowerCase().trim(), n=0;
      cards.forEach(function(c){
        var ok=(mod==="all"||c.getAttribute("data-k").split(" ").indexOf(mod)>-1)&&(!t||c.getAttribute("data-text").indexOf(t)>-1);
        c.hidden=!ok;if(ok)n++;
      });
      cnt.textContent="Viser "+n+" av "+cards.length+" videoer";
    };
    btns.forEach(function(b){b.addEventListener("click",function(){
      btns.forEach(function(x){x.classList.remove("active")});b.classList.add("active");mod=b.getAttribute("data-k");run();
    })});
    q.addEventListener("input",run);run();
  }

  // kildeside: filter
  var lq=$("#lq");
  if(lq){
    var lis=$$(".link-list li"), cats=$$(".cat"), lc=$("#l-count");
    var runl=function(){
      var t=lq.value.toLowerCase().trim(), n=0;
      lis.forEach(function(li){var ok=!t||li.getAttribute("data-text").indexOf(t)>-1;li.hidden=!ok;if(ok)n++});
      cats.forEach(function(c){var any=$$("li",c).some(function(li){return !li.hidden});c.hidden=!any});
      lc.textContent=t?("Viser "+n+" av "+lis.length+" lenker"):"";
    };
    lq.addEventListener("input",runl);
  }

  // søk
  var sf=$("#sform");
  if(sf){
    var sq=$("#sq"), res=$("#s-results"), sc=$("#s-count");
    var esc=function(s){return s.replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
    var hl=function(text,terms){
      var out=esc(text);
      terms.forEach(function(t){if(t.length<2)return;var re=new RegExp("("+t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","gi");out=out.replace(re,"<mark>$1</mark>")});
      return out;
    };
    var search=function(){
      var q=sq.value.trim().toLowerCase();
      res.innerHTML="";
      if(q.length<2){sc.textContent="Skriv minst to tegn.";return;}
      var terms=q.split(/\s+/).filter(Boolean), hits=[];
      (window.SEARCH_INDEX||[]).forEach(function(e){
        var title=e.t.toLowerCase(), sum=(e.s||"").toLowerCase(), body=(e.x||"").toLowerCase(), score=0, all=true;
        terms.forEach(function(t){
          var s=0;
          if(title.indexOf(t)>-1)s+=10;
          if(sum.indexOf(t)>-1)s+=4;
          if(body.indexOf(t)>-1)s+=1;
          if(!s)all=false;score+=s;
        });
        if(all)hits.push([score,e]);
      });
      hits.sort(function(a,b){return b[0]-a[0]});
      sc.textContent=hits.length+" treff for «"+q+"»";
      hits.slice(0,60).forEach(function(h){
        var e=h[1], li=document.createElement("li");
        var snip=e.s||"";
        if(!snip||terms.every(function(t){return snip.toLowerCase().indexOf(t)<0})){
          var b=(e.x||""), i=b.toLowerCase().indexOf(terms[0]);
          if(i>-1){snip="…"+b.slice(Math.max(0,i-80),i+160)+"…";}
        }
        var action=e.vid?'<button type="button" class="inline-video" data-vid="'+e.vid+'" data-title="'+esc(e.t)+'">Se video</button> ':"";
        li.innerHTML='<span class="rk">'+esc(e.k)+'</span><span class="muted">'+esc(e.m)+'</span><br><a class="rt" href="'+e.u+'">'+hl(e.t,terms)+'</a> '+action+'<p>'+hl(snip.slice(0,300),terms)+'</p>';
        res.appendChild(li);
      });
    };
    sf.addEventListener("submit",function(e){e.preventDefault();history.replaceState(null,"","?q="+encodeURIComponent(sq.value));search()});
    sq.addEventListener("input",search);
    var m=location.search.match(/[?&]q=([^&]*)/);
    if(m){sq.value=decodeURIComponent(m[1].replace(/\+/g," "));search();}
  }
})();
