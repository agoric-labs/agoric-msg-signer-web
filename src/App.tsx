import { ToastContainer } from "react-toastify";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { NetworkDropdown } from "./components/NetworkDropdown";
import { WalletConnectButton } from "./components/WalletConnectButton";
import { ReturnGrantsForm } from "./components/ReturnGrantsForm";

const App = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav
        title="Agoric Msg Signer"
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
        <div className="w-full max-w-5xl px-2 py-2 sm:px-0 m-auto">
          <div className="flex flex-col min-w-full rounded-xl bg-white p-3">
            <ReturnGrantsForm
              title="Return Grants"
              description="Creates /cosmos.vesting.v1beta1.MsgReturnGrants message"
            />
          </div>
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
