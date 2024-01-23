import {
  createContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import {
  SigningStargateClient,
  createAuthzAminoConverters,
  createBankAminoConverters,
} from "@cosmjs/stargate";
import { AccountData } from "@keplr-wallet/types";
import type { OfflineSigner } from "@cosmjs/proto-signing";
import { useNetwork, NetName } from "../hooks/useNetwork";
import { suggestChain } from "../lib/suggestChain";
import { getNetConfigUrl } from "../lib/getNetworkConfig";
import { registry } from "../lib/messageBuilder";
import { createVestingAminoConverters } from "../lib/amino";
import { accountParser } from "../lib/accountParser";
import { makeClient } from "../lib/startgate";

interface WalletContext {
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  stargateClient: SigningStargateClient | null;
  isLoading: boolean;
  rpc: string | null;
  chainId: string | null;
  offlineSigner: OfflineSigner | null;
  pubkey: Uint8Array | null;
}

export const WalletContext = createContext<WalletContext>({
  walletAddress: null,
  connectWallet: () => Promise.resolve(undefined),
  stargateClient: null,
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
  const stargateClient = useRef<SigningStargateClient | null>(null);
  const offlineSigner = useRef<OfflineSigner | null>(null);
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
      getNetConfigUrl(netName as NetName),
    );
    setRpc(rpc);
    setChainId(chainId);
    if (chainId) {
      await window.keplr.enable(chainId);
      offlineSigner.current = window.keplr.getOfflineSignerOnlyAmino(chainId);
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
        stargateClient.current = await makeClient(
          rpc,
          offlineSigner.current,
          converters,
          accountParser,
          registry,
        );
      } catch (e) {
        console.error("error stargateClient setup", e);
        window.localStorage.removeItem("walletAddress");
      } finally {
        setIsLoading(false);
      }
    }
  }, [netName]);

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
