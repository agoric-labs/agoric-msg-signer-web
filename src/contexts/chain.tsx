import { createContext, useEffect, useState, ReactNode, useRef } from "react";
import { AgoricChainStoragePathKind as Kind } from "@agoric/rpc";
import { makeAgoricWalletConnection } from "@agoric/web-components";
import isEqual from "lodash.isequal";
import { useNetwork } from "../hooks/useNetwork";
import { useWallet } from "../hooks/useWallet";
import { BrandData, CurrentWalletData, WalletData } from "../types/agoric";
import { toast } from "react-toastify";

interface ChainContext {
  assets: Array<unknown>;
  brands: Record<string, unknown> | undefined;
  purses: Array<unknown>;
  connection:
    | Awaited<ReturnType<typeof makeAgoricWalletConnection>>
    | undefined;
  timerService: unknown; // todo Remotable
}

export const ChainContext = createContext<ChainContext>({
  assets: [],
  brands: undefined,
  purses: [],
  connection: undefined,
  instance: undefined,
  timerService: undefined,
});

export const ChainContextProvider = ({ children }: { children: ReactNode }) => {
  const paths = new Set();
  const stoppers = [];
  const { watcher, networkConfig } = useNetwork();
  const [currChainName, setCurrChainName] = useState<string | undefined>(
    undefined
  );
  const [assets, setAssets] = useState<ChainContext["assets"]>([]);
  const [brands, setBrands] = useState<ChainContext["brands"]>(undefined);
  const { walletAddress } = useWallet();
  const connection = useRef<ChainContext["connection"]>(undefined);
  const [currWalletAddress, setCurrWalletAddress] = useState<
    string | undefined
  >(undefined);
  const [purses, setPurses] = useState([]);
  const [timerService, setTimerService] = useState(undefined);
  const [walletData, setWalletData] = useState<WalletData | undefined>(
    undefined
  );
  const [currentWalletData, setCurrentWalletData] = useState<
    CurrentWalletData | undefined
  >(undefined);

  useEffect(() => {
    if (
      networkConfig?.chainName &&
      currChainName !== networkConfig?.chainName
    ) {
      setCurrChainName(networkConfig.chainName);
      setBrands(undefined);
      setAssets([]);
      setPurses([]);
      setCurrWalletAddress(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkConfig]);

  const setWalletConnection = async () => {
    try {
      connection.current = await makeAgoricWalletConnection(watcher);
    } catch (e) {
      console.error("makeAgoricKeplrConnection", e);
    }
  };

  useEffect(() => {
    if (connection.current) return;
    if (watcher && !connection.current) {
      setWalletConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watcher]);

  const watchPath = (
    kind: Kind,
    path: string,
    handler: (args: unknown) => void
  ) => {
    if (!watcher) {
      console.error("watcher not initialized");
      return;
    }
    if (!paths.has(path)) {
      paths.add(path);
      stoppers.push(watcher.watchLatest([kind, path], handler));
    }
  };

  useEffect(() => {
    if (watcher && !brands) {
      watchPath(Kind.Data, "published.agoricNames.brand", (data) => {
        const formatted = (data as BrandData).reduce(
          (acc, [name, instance]) => ({ ...acc, [name]: instance }),
          {}
        );
        if (isEqual(formatted, brands)) return;
        setBrands(formatted);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watcher, brands]);

  useEffect(() => {
    if (watcher && !assets.length) {
      watchPath(Kind.Data, "published.agoricNames.vbankAsset", (data) => {
        // @ts-expect-error unknown
        const formatted = data.map(([_, d]) => d);
        if (isEqual(formatted, assets)) return;
        setAssets(formatted);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watcher, assets]);

  useEffect(() => {
    if (watcher && walletAddress && walletAddress !== currWalletAddress) {
      setCurrWalletAddress(walletAddress);
      watchPath(
        Kind.Data,
        `published.wallet.${walletAddress}.current`,
        (data) => {
          const walletData = data as CurrentWalletData;
          setCurrentWalletData(walletData);
          // const { offerToPublicSubscriberPaths } = data;
          console.log("published.wallet.current data", walletData);
          // TODO add purses to state we are interested in
        }
      );
      watchPath(Kind.Data, `published.wallet.${walletAddress}`, (data) => {
        const walletData = data as WalletData;
        setWalletData(walletData);
        console.log("published.wallet data", data);
        // TODO this should only fire after a user submits an offer; not when they arrive at the page.
        if (
          walletData?.status?.invitationSpec?.publicInvitationMaker ===
          "makeWorkAgreementInvitation"
        )
          toast.success(`Job ID: ${walletData?.status?.result}`);
        // TODO add purses to state
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watcher, walletAddress, currWalletAddress]);

  useEffect(() => {
    if (watcher && walletAddress && walletAddress !== currWalletAddress) {
      watchPath(Kind.Data, `mailbox.${walletAddress}`, (data) => {
        // TODO not working 🤔. expecting to see '{"ack":1,"outbox":[]}'
        console.log("mailbox data", data);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watcher, walletAddress]);

  useEffect(() => {
    if (watcher && !timerService) {
      const { marshaller } = watcher;
      // not reccomended!
      const capData = { body: '#"$0.Alleged: Timer"', slots: ["board05674"] };
      const timer = marshaller.fromCapData(capData);
      setTimerService(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watcher]);
  console.log("currentWalletData", currentWalletData);
  console.log("walletData", walletData);
  console.log({ brands, purses });
  return (
    <ChainContext.Provider
      value={{
        assets,
        brands,
        purses,
        connection: connection.current,
        timerService,
      }}
    >
      {children}
    </ChainContext.Provider>
  );
};
