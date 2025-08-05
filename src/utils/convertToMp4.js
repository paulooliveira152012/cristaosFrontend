import { FFmpeg } from "@ffmpeg/ffmpeg";

const ffmpeg = new FFmpeg();

export const convertToMp4 = async (file) => {
  if (!ffmpeg.loaded) {
    await ffmpeg.load();
  }

  const fileName = file.name;
  const inputName = "input." + fileName.split(".").pop();
  const outputName = "output.mp4";

  const fileData = await fetch(file).then(res => res.arrayBuffer());

  await ffmpeg.writeFile(inputName, new Uint8Array(fileData));
  await ffmpeg.exec(["-i", inputName, "-vcodec", "libx264", "-acodec", "aac", outputName]);

  const output = await ffmpeg.readFile(outputName);

  const mp4Blob = new Blob([output.buffer], { type: "video/mp4" });
  const mp4File = new File([mp4Blob], "converted.mp4", { type: "video/mp4" });

  return mp4File;
};
