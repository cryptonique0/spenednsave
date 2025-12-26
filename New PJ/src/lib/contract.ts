export const ON_CHAIN_RESUME_ABI = [
  {
    inputs: [],
    name: "constructor",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        name: "achievementName",
        type: "string",
      },
    ],
    name: "AchievementUnlocked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        name: "credentialType",
        type: "string",
      },
      {
        indexed: true,
        name: "verifier",
        type: "address",
      },
    ],
    name: "CredentialVerified",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        name: "credentialType",
        type: "string",
      },
      {
        indexed: false,
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "CredentialAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        name: "handle",
        type: "string",
      },
      {
        indexed: false,
        name: "ipfsHash",
        type: "string",
      },
    ],
    name: "ProfileCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        name: "ipfsHash",
        type: "string",
      },
    ],
    name: "ProfileUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        name: "newScore",
        type: "uint256",
      },
    ],
    name: "ReputationScoreUpdated",
    type: "event",
  },
  {
    inputs: [
      {
        name: "_credentialType",
        type: "string",
      },
      {
        name: "_issuer",
        type: "string",
      },
      {
        name: "_issuedDate",
        type: "uint256",
      },
      {
        name: "_expiryDate",
        type: "uint256",
      },
      {
        name: "_proofUrl",
        type: "string",
      },
    ],
    name: "addCredential",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        name: "_title",
        type: "string",
      },
      {
        name: "_description",
        type: "string",
      },
    ],
    name: "unlockAchievement",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        name: "_handle",
        type: "string",
      },
      {
        name: "_ipfsHash",
        type: "string",
      },
    ],
    name: "createProfile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        name: "_ipfsHash",
        type: "string",
      },
    ],
    name: "updateProfile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        name: "_user",
        type: "address",
      },
      {
        name: "_credentialIndex",
        type: "uint256",
      },
    ],
    name: "verifyCredential",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        name: "user",
        type: "address",
      },
    ],
    name: "getProfile",
    outputs: [
      {
        components: [
          {
            name: "owner",
            type: "address",
          },
          {
            name: "handle",
            type: "string",
          },
          {
            name: "ipfsHash",
            type: "string",
          },
          {
            name: "createdAt",
            type: "uint256",
          },
          {
            name: "updatedAt",
            type: "uint256",
          },
          {
            name: "reputationScore",
            type: "uint256",
          },
          {
            name: "verified",
            type: "bool",
          },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "_handle",
        type: "string",
      },
    ],
    name: "getUserByHandle",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "user",
        type: "address",
      },
    ],
    name: "getCredentials",
    outputs: [
      {
        components: [
          {
            name: "credentialType",
            type: "string",
          },
          {
            name: "issuer",
            type: "string",
          },
          {
            name: "issuedDate",
            type: "uint256",
          },
          {
            name: "expiryDate",
            type: "uint256",
          },
          {
            name: "proofUrl",
            type: "string",
          },
          {
            name: "verified",
            type: "bool",
          },
          {
            name: "verificationCount",
            type: "uint256",
          },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "user",
        type: "address",
      },
    ],
    name: "getCredentialCount",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "user",
        type: "address",
      },
    ],
    name: "getAchievements",
    outputs: [
      {
        components: [
          {
            name: "title",
            type: "string",
          },
          {
            name: "description",
            type: "string",
          },
          {
            name: "unlockedAt",
            type: "uint256",
          },
          {
            name: "verified",
            type: "bool",
          },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "user",
        type: "address",
      },
    ],
    name: "getAchievementCount",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "user",
        type: "address",
      },
    ],
    name: "getReputation",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getUserCount",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "_limit",
        type: "uint256",
      },
    ],
    name: "getTopProfiles",
    outputs: [
      {
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x230ec2A8fBb06C04C7eC982aF80AA067BD1D472D';
