export function generateGuiMain(): string {
  return `
def main():
    import faulthandler, traceback
    try:
        crash_log = open("crash_debug.log", "w", encoding="utf-8", buffering=1)
        faulthandler.enable(file=crash_log, all_threads=True)
    except Exception:
        crash_log = None

    def log_crash(header: str, exc_str: str):
        msg = f"\\n{header}:\\n{exc_str}\\n"
        print(msg, flush=True)
        if crash_log:
            try: crash_log.write(msg); crash_log.flush()
            except Exception: pass

    sys.excepthook = lambda t, v, tb: log_crash("[CRASH SYS.EXCEPTHOOK]", "".join(traceback.format_exception(t, v, tb)))
    threading.excepthook = lambda a: log_crash("[CRASH THREAD.EXCEPTHOOK]", "".join(traceback.format_exception(a.exc_type, a.exc_value, a.exc_traceback)))

    print("=" * 72)
    print(" VoiceTranslator Monitor v2.4 (RTX 5070 Ti) — Desktop GUI")
    print(f" Python: {sys.version.split()[0]} | Platform: {sys.platform}")
    print("=" * 72)
    if tk is None:
        log_crash("[FATAL]", "Tkinter не установлен в Python")
        sys.exit(1)
    try:
        root = tk.Tk()
        def _on_tk_err(exc, val, tb):
            log_crash("[TKINTER CALLBACK EXCEPTION]", "".join(traceback.format_exception(exc, val, tb)))
        tk.Tk.report_callback_exception = _on_tk_err

        app = VoiceTranslatorMonitorApp(root)
        def on_close():
            print("[VoiceTranslator] Окно закрыто пользователем.")
            app.running = False
            root.destroy()
        root.protocol("WM_DELETE_WINDOW", on_close)

        print("[VoiceTranslator] Tkinter окно успешно создано.")
        print("[VoiceTranslator] Запуск главного цикла GUI (root.mainloop)...")
        t0 = time.time()
        root.mainloop()
        dt = time.time() - t0
        print(f"[VoiceTranslator] Цикл GUI завершён (время работы: {dt:.2f} сек).")
        if dt < 2.5 and getattr(app, "running", False):
            log_crash("[АНОМАЛЬНОЕ ЗАКРЫТИЕ]", f"Окно закрылось через {dt:.2f} сек без команды пользователя.")
    except Exception as e:
        log_crash("[FATAL STARTUP ERROR]", traceback.format_exc())
        try: input("Нажмите ENTER для выхода из консоли...")
        except Exception: pass

if __name__ == "__main__":
    main()
`;
}
