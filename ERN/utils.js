const anchor = require('@project-serum/anchor');
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const { SystemProgram } = require('@solana/web3.js');
const {
    LAMPORTS_PER_SOL,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction,
} = require("@solana/web3.js");

/*export interface AlertState {
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error' | undefined;
}*/

const toDate = (value) => {
    if (!value) {
        return;
    }

    return new Date(value.toNumber() * 1000);
};

const numberFormater = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const formatNumber = {
    format: (val) => {
        if (!val) {
            return '--';
        }

        return numberFormater.format(val);
    },
    asNumber: (val) => {
        if (!val) {
            return undefined;
        }

        return val.toNumber() / LAMPORTS_PER_SOL;
    },
};

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID =
    new anchor.web3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

const CIVIC = new anchor.web3.PublicKey(
    'gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs',
);

const getAtaForMint = async (mint, buyer) => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [buyer.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    );
};

const getNetworkExpire = async (gatekeeperNetwork) => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [gatekeeperNetwork.toBuffer(), Buffer.from('expire')],
        CIVIC,
    );
};

const getNetworkToken = async (wallet, gatekeeperNetwork) => {
    return await anchor.web3.PublicKey.findProgramAddress(
        [
            wallet.toBuffer(),
            Buffer.from('gateway'),
            Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
            gatekeeperNetwork.toBuffer(),
        ],
        CIVIC,
    );
};

const createAssociatedTokenAccountInstruction = (associatedTokenAddress, payer, walletAddress, splTokenMintAddress) => {
    const keys = [
        {
            pubkey: payer,
            isSigner: true,
            isWritable: true,
        },
        {
            pubkey: associatedTokenAddress,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: walletAddress,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: splTokenMintAddress,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
    ];
    return new TransactionInstruction({
        keys,
        programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
        data: Buffer.from([]),
    });
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    toDate,
    formatNumber,
    getAtaForMint,
    getNetworkExpire,
    getNetworkToken,
    createAssociatedTokenAccountInstruction,
    sleep
}