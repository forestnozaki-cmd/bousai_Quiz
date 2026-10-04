// 防災チャレンジクイズ：オフライン対応用サービスワーカー
//
// 通信の悪い会場でも動かせるように、一度オンラインで開いたページ・データを
// 端末（ブラウザ）内にキャッシュしておき、次回以降はオフラインでもキャッシュから
// 表示できるようにします。
//
// クイズの問題やアプリ本体を更新したときは、下の CACHE_NAME の数字を
// 1つ増やして再アップロードしてください（例: v1 → v2）。
// こうすることで、次にオンラインで開いたときに新しい内容へ確実に更新されます。
const CACHE_NAME = "bosai-quiz-cache-v1";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./quiz-data.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// 基本方針：オンラインのときは常に最新版を取りに行き、取得できたらキャッシュを
// 更新する（ネットワーク優先）。オフラインで取得に失敗したときだけ、
// 最後にキャッシュした内容を表示する（キャッシュにフォールバック）。
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
