// The page your contacts see when they tap the "Live location" link in the SOS message.
// It needs no app and no login. It asks the server for the latest position
// every few seconds and moves the dot on the map.

const express = require("express");
const router = express.Router();
const { trackLimiter } = require("../middleware/rateLimiters");

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <meta name="referrer" content="no-referrer">
  <title>Sakhi live location</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <style>
    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; background: #FBF6F4; color: #2B1418; }
    body { display: flex; flex-direction: column; }
    header { background: #B01545; color: #fff; padding: 14px 16px; }
    header strong { display: block; font-size: 17px; }
    header span { font-size: 14px; opacity: .92; }
    #map { flex: 1; min-height: 0; }
    footer { display: flex; gap: 10px; padding: 12px 16px; background: #fff; border-top: 1px solid #F2B8C4; }
    footer a { flex: 1; text-align: center; padding: 12px; border-radius: 999px; font-weight: 600; text-decoration: none; font-size: 15px; }
    #gmaps { background: #F7DEDA; color: #4A0F17; }
    #call { background: #B01545; color: #fff; }
    #ended { display: none; padding: 20px 16px; text-align: center; background: #F7DEDA; color: #4A0F17; font-weight: 600; }
  </style>
</head>
<body>
  <header>
    <strong id="title">Sakhi emergency alert</strong>
    <span id="sub">Loading location...</span>
  </header>
  <div id="ended">This alert has ended. Please check in with them to make sure they are safe.</div>
  <div id="map"></div>
  <footer>
    <a id="gmaps" href="#" target="_blank" rel="noopener">Open in Google Maps</a>
    <a id="call" href="tel:112">Call 112</a>
  </footer>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var TOKEN = "__TOKEN__";
    var map = L.map("map").setView([22.9734, 78.6569], 5);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    var dot = null;
    var firstFix = true;
    var timer = null;

    function ago(iso) {
      var s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
      if (s < 10) return "just now";
      if (s < 60) return s + " seconds ago";
      var m = Math.round(s / 60);
      if (m < 60) return m + (m === 1 ? " minute ago" : " minutes ago");
      return Math.round(m / 60) + " hours ago";
    }

    function showEnded() {
      document.getElementById("ended").style.display = "block";
      document.getElementById("title").textContent = "Alert ended";
      document.getElementById("sub").textContent = "";
      document.getElementById("map").style.display = "none";
      document.querySelector("footer").style.display = "none";
      clearInterval(timer);
    }

    function poll() {
      fetch("/api/sos/track/" + TOKEN, { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error("not found"); return r.json(); })
        .then(function (d) {
          document.getElementById("title").textContent = d.firstName + " needs help";
          if (!d.active) return showEnded();
          if (d.latitude == null || d.longitude == null) {
            document.getElementById("sub").textContent = "Location not available yet. Please call them.";
            return;
          }
          var pos = [d.latitude, d.longitude];
          if (!dot) {
            dot = L.circleMarker(pos, { radius: 11, color: "#fff", weight: 3, fillColor: "#B01545", fillOpacity: 1 }).addTo(map);
          } else {
            dot.setLatLng(pos);
          }
          if (firstFix) { map.setView(pos, 16); firstFix = false; } else { map.panTo(pos); }
          document.getElementById("sub").textContent = "Live location, updated " + ago(d.updatedAt);
          document.getElementById("gmaps").href = "https://www.google.com/maps?q=" + d.latitude + "," + d.longitude;
        })
        .catch(function () {
          document.getElementById("sub").textContent = "This link is not valid or has expired.";
          clearInterval(timer);
        });
    }

    poll();
    timer = setInterval(poll, 8000);
  </script>
</body>
</html>`;

router.get("/:token", trackLimiter, (req, res) => {
  const { token } = req.params;

  // Only a 32-character hex code is accepted, so nothing else can be injected into the page.
  if (!/^[a-f0-9]{32}$/.test(token)) {
    return res.status(404).send("Not found");
  }

  res.set({
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
    "Referrer-Policy": "no-referrer",
  });
  res.type("html").send(PAGE.replace("__TOKEN__", token));
});

module.exports = router;
