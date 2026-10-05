import { ProjectConfig } from "../../../types/translator";
import { toCrLf } from "../common";

export function generateCheckDevicesPy(config: ProjectConfig): string {
  return toCrLf(`# -*- coding: utf-8 -*-
"""ШАГ 3: Диагностика аудиоустройств и микрофонов"""
import sounddevice as sd

def main():
    print("=" * 72)
    print("  СПИСОК АУДИОУСТРОЙСТВ WINDOWS")
    print("=" * 72)
    devs = sd.query_devices()
    apis = sd.query_hostapis()
    for idx, d in enumerate(devs):
        if int(d.get("max_input_channels", 0)) > 0:
            api_name = apis[d["hostapi"]]["name"] if d.get("hostapi") is not None else ""
            mark = " [ОСНОВНОЙ МИКРОФОН]" if idx == ${config.micDeviceIndex} else ""
            print(f"  [#{idx:2d}] ВХОД: {d['name']} ({api_name}){mark}")
        if int(d.get("max_output_channels", 0)) > 0:
            api_name = apis[d["hostapi"]]["name"] if d.get("hostapi") is not None else ""
            cable = " <-- VB-CABLE ВИРТУАЛЬНЫЙ ВХОД" if "cable" in d['name'].lower() else ""
            print(f"  [#{idx:2d}] ВЫХОД: {d['name']} ({api_name}){cable}")
    print("=" * 72)

if __name__ == "__main__":
    main()
`);
}
