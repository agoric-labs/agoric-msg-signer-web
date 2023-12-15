import {
  createContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { Decimal } from "@cosmjs/math";
import { AminoTypes, SigningStargateClient } from "@cosmjs/stargate";
import { AccountData } from "@keplr-wallet/types";
import { useNetwork, NetName } from "../hooks/useNetwork";
import { suggestChain } from "../lib/suggestChain";
import { getNetConfigUrl } from "../lib/getNetworkConfig";
import { registry } from "../lib/messageBuilder";
import { createVestingAminoConverters } from "../lib/amino";

interface WalletContext {
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  stargateClient: SigningStargateClient | undefined;
  isLoading: boolean;
  rpc: string | null;
}

export const WalletContext = createContext<WalletContext>({
  walletAddress: null,
  connectWallet: () => Promise.resolve(undefined),
  stargateClient: undefined,
  isLoading: false,
  rpc: null,
});

export const WalletContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const stargateClient = useRef<SigningStargateClient | undefined>(undefined);
  const { netName } = useNetwork();
  const [currNetName, setCurrNetName] = useState(netName);
  const [rpc, setRpc] = useState<WalletContext["rpc"]>(null);
  const [walletAddress, setWalletAddress] = useState<
    WalletContext["walletAddress"]
  >(() => {
    if (window.localStorage.getItem("walletAddress")) {
      return window.localStorage.getItem("walletAddress") || null;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const saveAddress = ({ address }: AccountData) => {
    window.localStorage.setItem("walletAddress", address);
    setWalletAddress(address);
  };

  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    const { chainId, rpc } = await suggestChain(
      getNetConfigUrl(netName as NetName)
    );
    setRpc(rpc);
    if (chainId) {
      await window.keplr.enable(chainId);
      const offlineSigner = window.keplr.getOfflineSignerOnlyAmino(chainId);
      const accounts = await offlineSigner.getAccounts();
      if (accounts?.[0].address !== walletAddress) {
        saveAddress(accounts[0]);
      }
      const converters = createVestingAminoConverters();
      try {
        stargateClient.current = await SigningStargateClient.connectWithSigner(
          rpc,
          offlineSigner,
          {
            // @ts-expect-error version mismatch
            registry,
            gasPrice: {
              denom: "uist",
              // @ts-expect-error version mismatch
              amount: Decimal.fromUserInput("50000000", 0),
            },
            aminoTypes: new AminoTypes(converters),
            converters,
          }
        );
      } catch (e) {
        console.error("error stargateClient setup", e);
        window.localStorage.removeItem("walletAddress");
      } finally {
        setIsLoading(false);
      }
    }
  }, [netName, walletAddress]);

  if (netName && currNetName !== netName) {
    if (walletAddress) connectWallet();
    setCurrNetName(netName);
  }

  useEffect(() => {
    if (walletAddress && netName && !stargateClient.current) {
      connectWallet();
    }
  }, [walletAddress, netName, connectWallet]);

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        connectWallet,
        stargateClient: stargateClient.current,
        isLoading,
        rpc,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
