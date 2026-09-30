"""
AEGIS FLOOD v2.0 - Image Session Isolation and SHA256 Verification Unit Test
"""
import base64
import hashlib
import shutil
import sys
import unittest
from pathlib import Path

# Ensure paths
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
IOT_DIR = ROOT_DIR / "iot"
if str(IOT_DIR) not in sys.path:
    sys.path.insert(0, str(IOT_DIR))
if str(IOT_DIR / "gateway") not in sys.path:
    sys.path.insert(0, str(IOT_DIR / "gateway"))

from gateway.main import FrameManager, SESSIONS_DIR, reset_controlled_simulation_state


class TestImageSessionIsolation(unittest.TestCase):

    def setUp(self):
        self.frame_manager = FrameManager()
        self.test_session_1 = "TEST-SESSION-001"
        self.test_session_2 = "TEST-SESSION-002"

        # Create two distinct dummy base64 JPEGs
        # JPEG header bytes + distinct payloads
        raw_bytes_1 = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00IMAGE_PAYLOAD_SESSION_1_FRAME_001"
        raw_bytes_2 = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00IMAGE_PAYLOAD_SESSION_2_FRAME_002"

        self.b64_img_1 = "data:image/jpeg;base64," + base64.b64encode(raw_bytes_1).decode("ascii")
        self.b64_img_2 = "data:image/jpeg;base64," + base64.b64encode(raw_bytes_2).decode("ascii")

        self.expected_hash_1 = hashlib.sha256(raw_bytes_1).hexdigest()
        self.expected_hash_2 = hashlib.sha256(raw_bytes_2).hexdigest()

    def tearDown(self):
        # Clean test session directories
        for sess in [self.test_session_1, self.test_session_2]:
            sess_dir = SESSIONS_DIR / sess
            if sess_dir.exists():
                shutil.rmtree(sess_dir, ignore_errors=True)

    def test_session_isolated_saving_and_sha256(self):
        # Save image 1 for session 1
        path1, hash1, size1 = self.frame_manager.save_base64_image(
            self.test_session_1, "FRAME-000001", self.b64_img_1
        )

        # Save image 2 for session 2
        path2, hash2, size2 = self.frame_manager.save_base64_image(
            self.test_session_2, "FRAME-000002", self.b64_img_2
        )

        # 1. SHA256 hashes must match expected byte hashes
        self.assertEqual(hash1, self.expected_hash_1)
        self.assertEqual(hash2, self.expected_hash_2)

        # 2. SHA256 hashes of two different images MUST be distinct
        self.assertNotEqual(hash1, hash2)

        # 3. File paths must be strictly session-isolated
        expected_path1 = SESSIONS_DIR / self.test_session_1 / "FRAME-000001" / "original.jpg"
        expected_path2 = SESSIONS_DIR / self.test_session_2 / "FRAME-000002" / "original.jpg"

        self.assertEqual(path1, expected_path1)
        self.assertEqual(path2, expected_path2)

        # 4. Verify physical files on disk
        self.assertTrue(path1.exists())
        self.assertTrue(path2.exists())

        with open(path1, "rb") as f:
            read_bytes_1 = f.read()
        with open(path2, "rb") as f:
            read_bytes_2 = f.read()

        self.assertEqual(hashlib.sha256(read_bytes_1).hexdigest(), hash1)
        self.assertEqual(hashlib.sha256(read_bytes_2).hexdigest(), hash2)

        # 5. Cross-session isolation check: Frame 1 does NOT exist in session 2 folder
        cross_path = SESSIONS_DIR / self.test_session_2 / "FRAME-000001" / "original.jpg"
        self.assertFalse(cross_path.exists())

    def test_simulation_reset_creates_new_session_id(self):
        session_before = reset_controlled_simulation_state()
        self.assertTrue(session_before.startswith("SIM-"))

        session_after = reset_controlled_simulation_state()
        self.assertTrue(session_after.startswith("SIM-"))
        self.assertNotEqual(session_before, session_after)


if __name__ == "__main__":
    unittest.main()
