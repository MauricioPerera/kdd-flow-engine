
import asyncio
from workflow_e2e_payment_fraud import run_Payment_Fraud_Detector

async def main():
    res = await run_Payment_Fraud_Detector({"amount": 15000})
    print("PYTHON_E2E_OK:", res["workflow_id"], res["results"]["script_decision"]["output"])

asyncio.run(main())
