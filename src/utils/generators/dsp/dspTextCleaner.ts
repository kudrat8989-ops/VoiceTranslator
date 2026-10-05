export function generateDspTextCleaner(): string {
  return `
def is_hallucination(text: str) -> bool:
    t = text.strip().lower()
    return len(t) < 2 or any(h in t for h in HALLUCINATIONS)

def clean_fillers(text: str, lang: str) -> str:
    if not text: return ""
    t = text.strip()
    if lang == "en":
        for p in [r"\\b(?:uh+|um+|er+|ah+|hmm+)\\b[,\\s]*", r"(?i)\\b(?:you know|i mean|kind of like)[,\\s]*"]:
            t = re.sub(p, " ", t)
        for pat, repl in [(r"(?i)\\bmakes sense\\b", "makes sense"), (r"(?i)\\bfigure out\\b", "understand")]:
            t = re.sub(pat, repl, t)
    else:
        t = re.sub(r"(?i)\\b(?:э-э+|м-м+|ну типа|короче|как бы)\\b[,\\s]*", " ", t)
    return re.sub(r"\\s+", " ", t).strip()

def clean_and_limit_whisper_words(text: str, duration_sec: float) -> str:
    if not text: return ""
    words = text.strip().split()
    if not words: return ""
    deduped = []
    for w in words:
        cw = re.sub(r"[^\\wа-яА-ЯёЁa-zA-Z0-9]", "", w).lower()
        if deduped and cw and cw == re.sub(r"[^\\wа-яА-ЯёЁa-zA-Z0-9]", "", deduped[-1]).lower() and not cw.isdigit():
            continue
        deduped.append(w)
    return " ".join(deduped[:max(8, int(duration_sec * 5.2) + 4)]).strip()

_U = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"]
_T = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"]
_D = ["", "десять", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"]
_H = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"]

def _num_to_words(n: int) -> str:
    if n <= 0: return "ноль" if n == 0 else "минус " + _num_to_words(-n)
    if n >= 1000000: return str(n)
    p, th, rem = [], n // 1000, n % 1000
    if th > 0:
        if th == 1: p.append("одна тысяча")
        elif th == 2: p.append("две тысячи")
        elif th in (3, 4): p.append(_num_to_words(th) + " тысячи")
        else: p.append(_num_to_words(th) + " тысяч")
    if rem > 0:
        h, last2 = rem // 100, rem % 100
        if h > 0: p.append(_H[h])
        if 10 <= last2 <= 19: p.append(_T[last2 - 10])
        else:
            if last2 // 10 > 0: p.append(_D[last2 // 10])
            if last2 % 10 > 0: p.append(_U[last2 % 10])
    return " ".join(p).strip()

def _year_prep_ru(year: int) -> str:
    if year == 2000: return "двухтысячном году"
    th = "две тысячи " if year >= 2000 else "тысяча "
    rem = year % 1000
    h_idx = rem // 100
    h_str = ["", "сто ", "двести ", "триста ", "четыреста ", "пятьсот ", "шестьсот ", "семьсот ", "восемьсот ", "девятьсот "][h_idx] if h_idx < 10 else ""
    last2 = rem % 100
    ords = {
        0: "году", 1: "первом", 2: "втором", 3: "третьем", 4: "четвёртом", 5: "пятом",
        6: "шестом", 7: "седьмом", 8: "восьмом", 9: "девятом", 10: "десятом",
        11: "одиннадцатом", 12: "двенадцатом", 13: "тринадцатом", 14: "четырнадцатом",
        15: "пятнадцатом", 16: "шестнадцатом", 17: "семнадцатом", 18: "восемнадцатом",
        19: "девятнадцатом", 20: "двадцатом", 30: "тридцатом", 40: "сороковом",
        50: "пятидесятом", 60: "шестидесятом", 70: "семидесятом", 80: "восьмидесятом", 90: "девяностом"
    }
    last_str = ords[last2] if last2 in ords else f"{_D[last2 // 10]} {ords.get(last2 % 10, '')}"
    return f"{th}{h_str}{last_str} году".replace("  ", " ")

def sanitize_for_silero(text: str) -> str:
    if not text: return ""
    res = re.sub(r"\\b(1[789]\\d\\d|20\\d\\d)\\s*(?:году|г\\.)\\b", lambda m: _year_prep_ru(int(m.group(1))), text, flags=re.I)
    res = re.sub(r"\\b(1[789]\\d\\d|20\\d\\d)\\b", lambda m: _year_prep_ru(int(m.group(1))), res)
    res = re.sub(r"\\b\\d{1,6}\\b", lambda m: " " + _num_to_words(int(m.group(0))) + " ", res)
    res = re.sub(r"[^а-яА-ЯёЁ\\s.,!?\\-]", " ", res)
    return re.sub(r"\\s+", " ", res).strip()[:350]
`;
}
