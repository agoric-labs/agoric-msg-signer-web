import { StdFee } from "@cosmjs/amino";
import { coins, Registry } from "@cosmjs/proto-signing";
import { StdSignDoc } from "@keplr-wallet/types";
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

export function createSignDoc(
  chainId: string,
  accountNumber: number,
  sequence: number,
  address: string
): StdSignDoc {
  console.log({ chainId, accountNumber, sequence, address });
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id: chainId,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    account_number: `${accountNumber}`,
    sequence: `${sequence}`,
    fee: {
      amount: [{ amount: "100", denom: "ubld" }],
      gas: "200000",
    },
    memo: "",
    msgs: [
      {
        // type: "cosmos-sdk/MsgReturnGrants",
        type: "/cosmos.vesting.v1beta1.MsgReturnGrants",
        // address,
        value: {
          address: address,
        },
        // "@type": "/cosmos.vesting.v1beta1.MsgReturnGrants",
        // address: address,
      },
    ],
  };
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
    // value: { address },
    value: { address },
  };
};
