export function generateGuiMain(): string {
  return `
def main():
    print("=" * 72)
    print(" VoiceTranslator Monitor v2.4 (RTX 5070 Ti) — Desktop GUI")
    print(f" Python: {sys.version.split()[0]} | Platform: {sys.platform}")
    print("=" * 72)
    try:
        root = tk.Tk()
        app = VoiceTranslatorMonitorApp(root)
        def on_close():
            app.running = False
            root.destroy()
        root.protocol("WM_DELETE_WINDOW", on_close)
        print("[VoiceTranslator] Tkinter window initialized successfully.")
        root.mainloop()
    except Exception as e:
        print("")
        print("!" * 72)
        print(f"[FATAL STARTUP ERROR]: {e}")
        import traceback
        traceback.print_exc()
        print("!" * 72)
        try:
            input("Нажмите ENTER для выхода из консоли...")
        except Exception:
            pass

if __name__ == "__main__":
    main()
`;
}
