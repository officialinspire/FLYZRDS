import math
from pathlib import Path
import subprocess
import sys
import unittest

from readiness import decode_candidate, validate_budget


class ReadinessTests(unittest.TestCase):
    def test_cli_rejects_unbounded_requests_before_model_import(self):
        script = Path(__file__).with_name('readiness.py')
        for arguments in [['--window-ms', 'nan'], ['--windows', '11'], ['--rate', 'inf']]:
            result = subprocess.run([sys.executable, str(script), *arguments],
                                    capture_output=True, text=True, timeout=5)
            self.assertEqual(result.returncode, 2)
            self.assertIn('error:', result.stderr)
            self.assertNotIn('brian2', result.stderr)

    def test_invalid_budget(self):
        for value in [math.nan, math.inf, -1, 0, 101]:
            with self.assertRaises(ValueError):
                validate_budget(value, 3)
        for value in [True, 1, 11, 3.5]:
            with self.assertRaises(ValueError):
                validate_budget(50, value)

    def test_decoder_never_infers_steering(self):
        self.assertEqual(decode_candidate({'forward': 0, 'feeding': 0}, .05),
                         {'speed': 0.0, 'turn': 0.0, 'interact': False})
        self.assertEqual(decode_candidate({'forward': 20, 'feeding': 1}, .05),
                         {'speed': 1.0, 'turn': 0.0, 'interact': True})
        self.assertEqual(decode_candidate({'forward': 5, 'feeding': 0}, .05)['speed'], .5)

    def test_rejects_invalid_readout(self):
        for value in [-1, math.nan, math.inf, 1.5, True, 100001]:
            with self.assertRaises(ValueError):
                decode_candidate({'forward': value, 'feeding': 0}, .05)
        with self.assertRaises(ValueError):
            decode_candidate({'forward': 1, 'reward': 1}, .05)
        for seconds in [0, -1, math.nan, math.inf]:
            with self.assertRaises(ValueError):
                decode_candidate({'forward': 1, 'feeding': 0}, seconds)


if __name__ == '__main__':
    unittest.main()
