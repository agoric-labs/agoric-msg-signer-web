import { StdFee } from "@cosmjs/amino";
import { Int53 } from "@cosmjs/math";
import { Any } from "cosmjs-types/google/protobuf/any";
import { coins, Registry } from "@cosmjs/proto-signing";
import { StdSignDoc, StdSignature } from "@keplr-wallet/types";
import { fromBase64 } from "@cosmjs/encoding";
import {
  encodePubkey,
  makeAuthInfoBytes,
  TxBodyEncodeObject,
} from "@cosmjs/proto-signing";
import {
  MsgReturnGrants,
  MsgCreateVestingAccount,
} from "cosmjs-types/cosmos/vesting/v1beta1/tx";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";
import { encodeSecp256k1Pubkey } from "@cosmjs/amino";

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

export function createStdSignDoc(
  chainId: string,
  accountNumber: number,
  sequence: number,
  address: string
): StdSignDoc {
  console.log({ chainId, accountNumber, sequence, address });
  return {
    chain_id: chainId,
    account_number: `${accountNumber}`,
    sequence: `${sequence}`,
    fee: {
      amount: [{ amount: "1000", denom: "uist" }],
      gas: "200000",
    },
    memo: "",
    msgs: [
      // XXX should this just be { address }, with no type or value?
      {
        // address,
        typeUrl: "/cosmos.vesting.v1beta1.MsgReturnGrants",
        value: { address },
      },
    ],
    timeout_height: "0",
  };
}

export const aminoResponseToTx = (
  signed: StdSignDoc,
  signature: StdSignature,
  pubkey: Uint8Array
): Uint8Array => {
  const signedTxBody = {
    messages: [
      {
        typeUrl: "/cosmos.vesting.v1beta1.MsgReturnGrants",
        value: signed.msgs[0],
      },
    ],
    memo: signed.memo,
    timeout_height: signed.timeout_height,
  };
  console.log("signedTxBody", signedTxBody);
  const signedTxBodyEncodeObject: TxBodyEncodeObject = {
    typeUrl: "/cosmos.tx.v1beta1.TxBody",
    value: signedTxBody,
  };
  const signedTxBodyBytes = registry.encode(signedTxBodyEncodeObject);
  const signedGasLimit = Int53.fromString(signed.fee.gas).toNumber();
  const signedSequence = Int53.fromString(signed.sequence).toNumber();
  const signedAuthInfoBytes = makeAuthInfoBytes(
    [
      {
        pubkey: encodePubkey(encodeSecp256k1Pubkey(pubkey)),
        sequence: signedSequence,
      },
    ],
    signed.fee.amount,
    signedGasLimit,
    signed.fee.granter,
    signed.fee.payer,
    SignMode.SIGN_MODE_LEGACY_AMINO_JSON
  );
  const txRawEncoded = TxRaw.encode(
    TxRaw.fromPartial({
      bodyBytes: signedTxBodyBytes,
      authInfoBytes: signedAuthInfoBytes,
      signatures: [fromBase64(signature.signature)],
    })
  ).finish();
  console.log(
    "txEncoded protoString",
    Object.values(txRawEncoded)
      .map((n) => Number(n).toString(16).padStart(2, "0"))
      .join(" ")
  );
  return txRawEncoded;
};

export const makeFeeObject = ({ denom, amount, gas }: MakeFeeObjectArgs) =>
  ({
    amount: coins(amount || 0, denom || "uist"),
    gas: gas ? String(gas) : "auto",
  } as StdFee);

// export const makeReturnGrantsMsg = (address: string) => {
//   return {
//     typeUrl: "/cosmos.vesting.v1beta1.MsgReturnGrants",
//     value: { address },
//   };
// };

// XXX not currently used
export const postTransaction = async (
  txBytes: string,
  mode = "BROADCAST_MODE_BLOCK"
) => {
  try {
    const res = await fetch(
      "https://emerynet.api.agoric.net/cosmos/tx/v1beta1/txs",
      {
        method: "POST",
        body: JSON.stringify({
          tx_bytes: txBytes, // base64 string req.
          mode: mode,
        }),
      }
    );
    if (res) return res;
  } catch (e) {
    console.error("e", e);
  }
};
