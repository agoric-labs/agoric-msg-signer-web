import { AminoMsg, Coin } from "@cosmjs/amino";
import {
  MsgReturnGrants,
  MsgCreateVestingAccount,
} from "cosmjs-types/cosmos/vesting/v1beta1/tx";
import { AminoConverters } from "@cosmjs/stargate";
// import { toBech32, fromBase64, toBase64 } from "@cosmjs/encoding";
// import { toAccAddress } from "@cosmjs/stargate/build/queryclient/utils";
// import { bech32Config } from "../lib/suggestChain";

export interface AminoMsgReturnGrants extends AminoMsg {
  readonly type: "cosmos-sdk/MsgCreateVestingAccount";
  readonly value: {
    /** Bech32 account address */
    readonly address: string;
  };
}

export interface AminoMsgCreateVestingAccount extends AminoMsg {
  readonly type: "cosmos-sdk/MsgCreateVestingAccount";
  readonly value: {
    /** Bech32 account address */
    readonly from_address: string;
    /** Bech32 account address */
    readonly to_address: string;
    readonly amount: readonly Coin[];
    readonly end_time: string;
    readonly delayed: boolean;
  };
}

export function isAminoMsgCreateVestingAccount(
  msg: AminoMsg
): msg is AminoMsgCreateVestingAccount {
  return msg.type === "cosmos-sdk/MsgCreateVestingAccount";
}

export function createVestingAminoConverters(): AminoConverters {
  return {
    "/cosmos.vesting.v1beta1.MsgReturnGrants": {
      aminoType: "cosmos-sdk/MsgReturnGrants",
      toAmino: ({
        address,
      }: MsgReturnGrants): AminoMsgReturnGrants["value"] => ({
        // address: toBech32(
        //   bech32Config.bech32PrefixAccAddr,
        //   fromBase64(address)
        // ),
        address,
      }),
      fromAmino: ({
        address,
      }: AminoMsgReturnGrants["value"]): MsgReturnGrants => ({
        // address: toBase64(toAccAddress(address)),
        address,
      }),
    },
    "/cosmos.vesting.v1beta1.MsgCreateVestingAccount": {
      aminoType: "cosmos-sdk/MsgCreateVestingAccount",
      toAmino: ({
        fromAddress,
        toAddress,
        amount,
        endTime,
        delayed,
      }: MsgCreateVestingAccount): AminoMsgCreateVestingAccount["value"] => ({
        from_address: fromAddress,
        to_address: toAddress,
        amount: [...amount],
        end_time: endTime.toString(),
        delayed: delayed,
      }),
      fromAmino: ({
        from_address,
        to_address,
        amount,
        end_time,
        delayed,
      }: AminoMsgCreateVestingAccount["value"]): MsgCreateVestingAccount => ({
        fromAddress: from_address,
        toAddress: to_address,
        amount: [...amount],
        endTime: BigInt(end_time),
        delayed: delayed,
      }),
    },
  };
}
