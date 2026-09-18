/* TIC Speciation Calculator — service worker
 *
 * Strategy:
 *   navigation requests (the page itself)  -> network first, cache as fallback
 *   same-origin static assets              -> cache first, refreshed in background
 *   Google Fonts                           -> cache first, long-lived
 *
 * Network-first on the page is deliberate: it means a new commit to
 * index.html shows up on the next online load without anyone having to
 * clear storage. Bump CACHE_VERSION only when you change this file or
 * the asset list below.
 */

var CACHE_VERSION = "v1";
var SHELL = "tic-shell-" + CACHE_VERSION;
var FONTS = "tic-fonts-" + CACHE_VERSION;

var PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(SHELL).then(function(c){
      // addAll fails the whole install if any single item 404s, so add individually
      return Promise.all(PRECACHE.map(function(u){
        return c.add(u).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k !== SHELL && k !== FONTS) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;

  var url = new URL(req.url);
  var isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";

  // The page: network first so deployments are picked up immediately.
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(SHELL).then(function(c){ c.put("./index.html", copy); });
        return res;
      }).catch(function(){
        return caches.match("./index.html").then(function(hit){
          return hit || caches.match("./");
        });
      })
    );
    return;
  }

  // Fonts: cache first, they never change under a given URL.
  if(isFont){
    e.respondWith(
      caches.match(req).then(function(hit){
        return hit || fetch(req).then(function(res){
          var copy = res.clone();
          caches.open(FONTS).then(function(c){ c.put(req, copy); });
          return res;
        }).catch(function(){ return hit; });
      })
    );
    return;
  }

  // Everything else same-origin: cache first, revalidate quietly.
  if(url.origin === location.origin){
    e.respondWith(
      caches.match(req).then(function(hit){
        var net = fetch(req).then(function(res){
          var copy = res.clone();
          caches.open(SHELL).then(function(c){ c.put(req, copy); });
          return res;
        }).catch(function(){ return hit; });
        return hit || net;
      })
    );
  }
});
