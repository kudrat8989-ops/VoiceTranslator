export {
  generateRequirementsTxt,
  generateStep1CleanBat,
  generateStep2VenvBat,
  generateStep2VenvBat as generateStep2_1CreateVenvBat,
  generateStep3CheckAudioBat,
  generateStep5InstallVbCableBat,
} from "./bat/setupStepsBat";

export {
  generateStep2PytorchBat,
  generateStep2PytorchBat as generateStep2_2InstallPytorchBat,
  generateStep2EnginesBat,
  generateStep2EnginesBat as generateStep2_3InstallEnginesBat,
} from "./bat/pytorchAndEnginesBat";

export { generateRunBat } from "./bat/runBat";
