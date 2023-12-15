import { StdFee } from "@cosmjs/amino";
import { coins, Registry } from "@cosmjs/proto-signing";
// import { toBase64 } from "@cosmjs/encoding";
// import { toAccAddress } from "@cosmjs/stargate/build/queryclient/utils";
import {
  MsgReturnGrants,
  MsgCreateVestingAccount,
} from "cosmjs-types/cosmos/vesting/v1beta1/tx";

export const registry = new Registry(
  // @ts-expect-error version mismatch
  [
    [
      "/cosmos.vesting.v1beta1.MsgCreateVestingAccount",
      MsgCreateVestingAccount,
    ],
    ["/cosmos.vesting.v1beta1.MsgReturnGrants", MsgReturnGrants],
  ]
);

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

export const makeReturnGrantsMsg = (address: string) => {
  return {
    typeUrl: "/cosmos.vesting.v1beta1.MsgReturnGrants",
    // value: MsgReturnGrants.encode(
    // MsgReturnGrants.fromPartial({
    //   address,
    // })
    // ).finish(),
    // value: {
    //   address: toBase64(toAccAddress(address)),
    // },
    value: { address },
  };
};
