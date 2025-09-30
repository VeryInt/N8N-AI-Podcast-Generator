// Function to parse the FFmpeg output
async function parseFfmpegOutput(ffmpegOutput) {
    const result = {
      audioDurationSeconds: null,
      durationFormatted: null,
      bitrateKbps: null,
      audioCodec: null,
      sampleRateHz: null,
      channels: null,
      format: null,
      streamBitrateKbps: null,
      // Add an error field to indicate parsing issues
      parsingError: false,
      errorMessage: null,
      // Optional: Keep raw output for debugging
      // ffmpegRawOutput: ffmpegOutput
    };
  
    try {
      // --- 1. 提取时长和整体比特率 ---
      // Example: Duration: 00:00:14.38, start: 0.000000, bitrate: 128 kb/s
      const durationAndBitrateMatch = ffmpegOutput.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2}),.*?bitrate: (\d+) kb\/s/);
  
      if (durationAndBitrateMatch) {
        const hours = parseInt(durationAndBitrateMatch[1], 10);
        const minutes = parseInt(durationAndBitrateMatch[2], 10);
        const seconds = parseFloat(durationAndBitrateMatch[3]); // 包含小数部分
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
        result.audioDurationSeconds = totalSeconds;
        result.durationFormatted = durationAndBitrateMatch[1] + ':' + durationAndBitrateMatch[2] + ':' + durationAndBitrateMatch[3];
        result.bitrateKbps = parseInt(durationAndBitrateMatch[4], 10);
      } else {
        // If duration pattern not found, log a warning
        console.warn("FFmpeg output does not contain expected 'Duration' and 'bitrate' pattern.");
        // You might want to set a specific error flag here if this is critical
      }
  
      // --- 2. 提取音频流信息 ---
      // Example: Stream #0:0: Audio: mp3, 24000 Hz, mono, fltp, 128 kb/s
      const audioStreamMatch = ffmpegOutput.match(/Stream #\d+:\d+: Audio: (.+?), (\d+) Hz, (mono|stereo|5\.1|7\.1), ([\w\d]+), (\d+) kb\/s/);
      if (audioStreamMatch) {
        result.audioCodec = audioStreamMatch[1].trim();
        result.sampleRateHz = parseInt(audioStreamMatch[2], 10);
        result.channels = audioStreamMatch[3].trim();
        result.format = audioStreamMatch[4].trim();
        result.streamBitrateKbps = parseInt(audioStreamMatch[5], 10);
      } else {
        // Fallback regex for audio stream info, might miss bitrate
        const audioStreamMatchLoose = ffmpegOutput.match(/Stream #\d+:\d+: Audio: (.+?), (\d+) Hz, (mono|stereo|5\.1|7\.1), ([\w\d]+)/);
        if (audioStreamMatchLoose) {
          result.audioCodec = audioStreamMatchLoose[1].trim();
          result.sampleRateHz = parseInt(audioStreamMatchLoose[2], 10);
          result.channels = audioStreamMatchLoose[3].trim();
          result.format = audioStreamMatchLoose[4].trim();
        } else {
            console.warn("FFmpeg output does not contain expected 'Audio Stream' pattern.");
            // You might set another error flag if this is critical
        }
      }
  
    } catch (error) {
      // Catch any unexpected errors during parsing
      console.error("Error during FFmpeg output parsing:", error.message);
      result.parsingError = true;
      result.errorMessage = `Error parsing FFmpeg output: ${error.message}`;
      // Optionally; re-throw if it's a critical unrecoverable error
      // throw new Error(`Failed to parse FFmpeg output: ${error.message}`);
    }
  
    return result;
  }
  
  // Get the ffmpeg output from the previous node
  // Assuming the previous node (Execute Command) outputs to $json.stderr
  // It's also possible that on error, $json.stderr might be different or even empty.
  const ffmpegOutput = $json.stderr || ""; // Ensure it's a string, even if null/undefined
  
  // Execute the parsing function
  const parsedInfo = await parseFfmpegOutput(ffmpegOutput);
  
  // Return the parsed information as a JSON object for the next node
  return [{
    json: parsedInfo
  }];
  