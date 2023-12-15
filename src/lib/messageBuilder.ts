import { StdFee } from "@cosmjs/amino";
import { coins, Registry } from "@cosmjs/proto-signing";
import {
  MsgReturnGrants,
  MsgCreateVestingAccount,
} from "cosmjs-types/cosmos/vesting/v1beta1/tx";

export const registry = new Registry([
  ["/cosmos.vesting.v1beta1.MsgCreateVestingAccount", MsgCreateVestingAccount],
  ["/cosmos.vesting.v1beta1.MsgReturnGrants", MsgReturnGrants],
]);

interface MakeFeeObjectArgs {
  denom?: string;
  amount?: string | number;
  gas?: string | number;
}

export const makeFeeObject = ({ denom, amount, gas }: MakeFeeObjectArgs) =>
  ({
    amount: coins(amount || 0, denom || "uist"),
    gas: gas ? String(gas) : "auto",
  } as StdFee);

export const makeReturnGrantsMsg = (address: string) => ({
  typeUrl: "/cosmos.vesting.v1beta1.MsgReturnGrants",
  value: {
    address,
  },
});
