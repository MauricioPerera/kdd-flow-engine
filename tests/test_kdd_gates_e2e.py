import unittest
import os
import subprocess
import hashlib
import glob

class TestKDDGatesE2E(unittest.TestCase):
    def test_okf_nodes_integrity(self):
        """Validates that all OKF nodes in knowledge/ comply with the standard."""
        res = subprocess.run(
            ["python", "scripts/validate_okf.py", "knowledge"],
            capture_output=True,
            text=True
        )
        self.assertEqual(res.returncode, 0, f"OKF validation failed: {res.stdout}\n{res.stderr}")
        self.assertIn("todos los nodos OKF son conformes", res.stdout)

    def test_ccdd_contracts_integrity(self):
        """Validates that all CCDD task contracts match their frozen test oracles."""
        res = subprocess.run(
            ["python", "scripts/validate_contracts.py", "knowledge/contracts"],
            capture_output=True,
            text=True
        )
        self.assertEqual(res.returncode, 0, f"CCDD validation failed: {res.stdout}\n{res.stderr}")
        self.assertIn("todos los contratos son validos", res.stdout)

    def test_all_contract_test_files_exist(self):
        """Verifies that all referenced test oracle files exist on disk."""
        contract_files = glob.glob("knowledge/contracts/*.md")
        self.assertGreater(len(contract_files), 0)
        for cf in contract_files:
            with open(cf, "r", encoding="utf-8") as f:
                content = f.read()
                for line in content.splitlines():
                    if line.startswith("tests:"):
                        test_path = line.split(":", 1)[1].strip().strip("'").strip('"')
                        self.assertTrue(os.path.exists(test_path), f"Test file {test_path} does not exist for {cf}")

if __name__ == "__main__":
    unittest.main()
