import os
import librosa
import numpy as np
from typing import List
from pose_format import Pose
from pose_format.pose_visualizer import PoseVisualizer
from translation.spoken_to_signed_translation.spoken_to_signed.gloss_to_pose import gloss_to_pose, CSVPoseLookup, concatenate_poses
from translation.spoken_to_signed_translation.spoken_to_signed.text_to_gloss.types import Gloss
from translation.spoken_to_signed_translation.spoken_to_signed.text_to_gloss.simple import text_to_gloss
from translation.spoken_to_signed_translation.spoken_to_signed.gloss_to_pose.lookup.fingerspelling_lookup import FingerspellingPoseLookup

def _gloss_to_pose(sentences: List[Gloss], lexicon: str, spoken_language: str, signed_language: str) -> Pose:
    fingerspelling_lookup = FingerspellingPoseLookup()
    pose_lookup = CSVPoseLookup(lexicon, backup=fingerspelling_lookup)
    poses = [gloss_to_pose(gloss, pose_lookup, spoken_language, signed_language) for gloss in sentences]
    if len(poses) == 1:
        return poses[0]
    return concatenate_poses(poses, trim=False)

def _pose_to_video(pose: Pose):
    v = PoseVisualizer(pose)
    return v.draw()

def text_to_gloss_to_pose_to_video(
    text: str,
    lexicon: str | None = None,
    spoken_language: str = 'it',
    signed_language: str = 'slf'
):
    if lexicon is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        lexicon = os.path.join(script_dir, 'spoken_to_signed_translation', 'assets', 'dummy_lexicon')

    sentences = text_to_gloss(text, spoken_language)
    pose = _gloss_to_pose(sentences, lexicon, spoken_language, signed_language)
    frames = _pose_to_video(pose)

    return frames

def convert_audio(raw_bytes: bytearray):
    audio_stereo = np.frombuffer(raw_bytes, dtype=np.int16)
    audio_stereo = audio_stereo.reshape(-1, 2)
    audio_mono_normalized = (audio_stereo.mean(axis=1) / 32768.0).astype(np.float32)
    audio_16k = librosa.resample(audio_mono_normalized, orig_sr=48000, target_sr=16000)

    return audio_16k