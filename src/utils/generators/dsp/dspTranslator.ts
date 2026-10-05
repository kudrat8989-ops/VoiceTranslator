export function generateDspTranslator(): string {
  return `
class FastKeepAliveTranslator:
    def __init__(self):
        self._local = threading.local()

    def translate(self, text: str, src: str, dst: str, fallback_whisper_func=None) -> str:
        clean = clean_fillers(text, src)
        if not clean: return ""
        q = urllib.parse.quote(clean)
        path = f"/translate_a/single?client=gtx&sl={src}&tl={dst}&dt=t&q={q}"
        for _ in range(2):
            try:
                conn = getattr(self._local, "conn", None)
                if conn is None:
                    conn = http.client.HTTPSConnection("translate.googleapis.com", timeout=3.5)
                    self._local.conn = conn
                conn.request("GET", path, headers={"User-Agent": "Mozilla/5.0"})
                resp = conn.getresponse()
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8", errors="ignore"))
                    if data and isinstance(data[0], list):
                        tr = "".join(seg[0] for seg in data[0] if seg and seg[0]).strip()
                        if tr: return tr
                conn.close()
                self._local.conn = None
            except Exception:
                self._local.conn = None

        if fallback_whisper_func is not None:
            try:
                fb = fallback_whisper_func(clean)
                if fb: return fb
            except Exception: pass
        return clean

TRANSLATOR = FastKeepAliveTranslator()
`;
}
