import { useRef, FormEvent, ReactNode } from "react";
import { createId } from "@paralleldrive/cuid2";
import { toast } from "react-toastify";
import { Button } from "./Button";
import { TxToastMessage } from "./TxToastMessage";
import { useNetwork, NetName } from "../hooks/useNetwork";
import { useWallet } from "../hooks/useWallet";
import { DeliverTxResponse, assertIsDeliverTxSuccess } from "@cosmjs/stargate";
import { makeFeeObject, makeReturnGrantsMsg } from "../lib/messageBuilder";
import { parseError } from "../utils/transactionParser";

interface FormProps {
  title: ReactNode;
  description: ReactNode;
}

const ReturnGrantsForm = ({ title, description }: FormProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const walletInputRef = useRef<HTMLInputElement>(null);
  const { walletAddress, stargateClient } = useWallet();
  const { netName } = useNetwork();

  const handlePopulateAddress = () => {
    if (!walletAddress) {
      toast.info("Please connect wallet first!", { autoClose: 3000 });
      return;
    }
    if (!walletInputRef.current) throw new Error("Form input not found");
    walletInputRef.current.value = walletAddress;
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) throw new Error("No form data");
    const formData = new FormData(formRef.current);
    const address = (formData.get("walletAddress") as string) || "";
    if (!stargateClient) {
      toast.error("Network not connected.", { autoClose: 3000 });
      throw new Error("stargateClient not found");
    }
    if (!walletAddress) throw new Error("wallet not connected");
    const toastId = createId();
    toast.loading("Sending transaction to wallet...", {
      toastId,
    });
    let txResult: DeliverTxResponse | undefined;
    try {
      const msg = makeReturnGrantsMsg(address);
      const estimate = await stargateClient.simulate(
        walletAddress,
        [msg],
        undefined
      );
      const adjustment = 1.3;
      const gas = Math.ceil(estimate * adjustment);
      txResult = await stargateClient.signAndBroadcast(
        walletAddress,
        [msg],
        makeFeeObject({ gas }),
        "" // memo
      );
      assertIsDeliverTxSuccess(txResult);
    } catch (e) {
      console.error(e);
      toast.update(toastId, {
        render: parseError(e as Error),
        type: "error",
        isLoading: false,
        autoClose: 10000,
      });
    }
    if (txResult && txResult.code === 0) {
      toast.update(toastId, {
        render: ({ closeToast }) => (
          <TxToastMessage
            resp={txResult as DeliverTxResponse}
            netName={netName as NetName}
            closeToast={closeToast as () => void}
          />
        ),
        type: "success",
        isLoading: false,
      });
      formRef.current?.reset();
    }
  };

  return (
    <form ref={formRef} className="py-6 px-8" onSubmit={onSubmit}>
      <div className="space-y-12 sm:space-y-16">
        <div>
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            {title}
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">
            {description}
          </p>

          <div className="sm:grid sm:grid-cols-5 sm:items-start sm:gap-4 sm:py-6">
            <label
              htmlFor="address"
              className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5"
            >
              Wallet Address
            </label>
            <div className="mt-2 sm:col-span-4 sm:mt-0">
              <input
                ref={walletInputRef}
                type="text"
                name="walletAddress"
                id="walletAddress"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:max-w-xl sm:text-xs sm:leading-6"
              />
              <p className="mt-3 text-xs leading-6 text-gray-600">
                Your wallet address.
              </p>
            </div>
          </div>
          <div className="sm:grid sm:grid-cols-5 sm:items-start sm:gap-4">
            <div className="mt-2 sm:col-span-1 sm:mt-0">
              <button
                className="text-sm bg-wild-sand-100 hover:bg-wild-sand-200 items-center justify-center rounded-md px-2 py-2 my-auto mt-1"
                type="button"
                onClick={handlePopulateAddress}
              >
                Populate with Keplr
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-x-32">
        <Button
          type="submit"
          Icon={null}
          text="Sign Transaction"
          theme="dark"
          layoutStyle="flex w-1/4"
        />
      </div>
    </form>
  );
};

export { ReturnGrantsForm };
