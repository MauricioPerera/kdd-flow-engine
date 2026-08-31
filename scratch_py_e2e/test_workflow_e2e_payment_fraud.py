import unittest
import asyncio
from workflow_e2e_payment_fraud import run_Payment_Fraud_Detector

class TestWorkflowe2e_payment_fraud(unittest.TestCase):
    def test_execution(self):
        result = asyncio.run(run_Payment_Fraud_Detector({"test": True}))
        self.assertEqual(result["workflow_id"], "e2e_payment_fraud")
        self.assertIn("results", result)

if __name__ == "__main__":
    unittest.main()
