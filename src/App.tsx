import { ToastContainer } from "react-toastify";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { NetworkDropdown } from "./components/NetworkDropdown";
import { WalletConnectButton } from "./components/WalletConnectButton";
import { Tabs } from "./components/Tabs";
import { ProposeBountyForm } from "./components/ProposeBountyForm";

const App = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav
        title="Agoric Proto Signer"
        showLogo={false}
        rightContent={
          <>
            <div className="mr-6 relative">
              <NetworkDropdown />
            </div>
            <WalletConnectButton theme="white" />
          </>
        }
      />
      <main className="flex-grow mx-auto max-w-7xl min-w-full py-6 sm:px-6 lg:px-8">
        <div className="my-0 mx-auto max-w-3xl bg-white rounded p-3">
          <ProposeBountyForm
            title="Propose Bounty"
            description="Attach a bounty or reward to a GitHub Issue. When a Pull Request that marks the issue closed is approved and merged, the bounty will be released to the PR author."
          />
        </div>
      </main>
      <Footer />
      <ToastContainer
        autoClose={false}
        position="bottom-right"
        closeOnClick={false}
        closeButton={true}
        bodyClassName="text-sm font-medium text-gray-900"
      />
    </div>
  );
};

export default App;
