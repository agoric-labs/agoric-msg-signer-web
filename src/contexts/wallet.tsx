import {
  createContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { Decimal } from "@cosmjs/math";
import {
  AminoTypes,
  SigningStargateClient,
  createAuthzAminoConverters,
  createBankAminoConverters,
} from "@cosmjs/stargate";
import { AccountData } from "@keplr-wallet/types";
import { useNetwork, NetName } from "../hooks/useNetwork";
import { suggestChain } from "../lib/suggestChain";
import { getNetConfigUrl } from "../lib/getNetworkConfig";
import { registry } from "../lib/messageBuilder";
import { createVestingAminoConverters } from "../lib/amino";
import { accountParser } from "../lib/accountParser";

interface WalletContext {
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  stargateClient: SigningStargateClient | undefined;
  isLoading: boolean;
  rpc: string | null;
  chainId: string | null;
  offlineSigner: any;
  pubkey: Uint8Array | null;
}

export const WalletContext = createContext<WalletContext>({
  walletAddress: null,
  connectWallet: () => Promise.resolve(undefined),
  stargateClient: undefined,
  isLoading: false,
  rpc: null,
  chainId: null,
  offlineSigner: null,
  pubkey: null,
});

export const WalletContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const stargateClient = useRef<SigningStargateClient | undefined>(undefined);
  const offlineSigner = useRef<any>(undefined);
  const { netName } = useNetwork();
  const [currNetName, setCurrNetName] = useState(netName);
  const [rpc, setRpc] = useState<WalletContext["rpc"]>(null);
  const [pubkey, setPubkey] = useState<Uint8Array | null>(null);
  const [chainId, setChainId] = useState<WalletContext["chainId"]>(null);
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
    setChainId(chainId);
    if (chainId) {
      await window.keplr.enable(chainId);
      offlineSigner.current = window.keplr.getOfflineSignerOnlyAmino(chainId);
      // const offlineSigner = window.keplr.getOfflineSigner(chainId);
      const accounts = await offlineSigner.current.getAccounts();
      // if (accounts?.[0].address !== walletAddress) {
      console.log("accounts[0]", accounts[0]);
      saveAddress(accounts[0]);
      setPubkey(accounts[0].pubkey);
      // }
      const converters = {
        ...createAuthzAminoConverters(),
        ...createBankAminoConverters(),
        ...createVestingAminoConverters(),
      };
      try {
        stargateClient.current = await SigningStargateClient.connectWithSigner(
          rpc,
          offlineSigner.current,
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
            accountParser,
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
        offlineSigner: offlineSigner.current,
        isLoading,
        rpc,
        chainId,
        pubkey,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
