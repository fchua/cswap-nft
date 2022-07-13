/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getWalletData = /* GraphQL */ `
  query GetWalletData($id: ID!) {
    getWalletData(id: $id) {
      id
      ethereumAddress
      cardanoAddress
      cswapEthBalance
      TokenSnapshot {
        id
        ethereumAddress
        cswapBalance
        addressType
        createdAt
        updatedAt
      }
      AddressMapping {
        id
        ethereumAddress
        cardanoAddress
        createdAt
        updatedAt
      }
      cswapCardanoBalance
      hasLoggedIn
      hasClaimedNft
      createdAt
      updatedAt
      walletDataTokenSnapshotId
      walletDataAddressMappingId
    }
  }
`;
export const listWalletData = /* GraphQL */ `
  query ListWalletData(
    $filter: ModelWalletDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listWalletData(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        ethereumAddress
        cardanoAddress
        cswapEthBalance
        cswapCardanoBalance
        hasLoggedIn
        hasClaimedNft
        createdAt
        updatedAt
        walletDataTokenSnapshotId
        walletDataAddressMappingId
      }
      nextToken
    }
  }
`;
export const walletDataByCardanoAddress = /* GraphQL */ `
  query WalletDataByCardanoAddress(
    $cardanoAddress: String!
    $sortDirection: ModelSortDirection
    $filter: ModelWalletDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    walletDataByCardanoAddress(
      cardanoAddress: $cardanoAddress
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        ethereumAddress
        cardanoAddress
        cswapEthBalance
        cswapCardanoBalance
        hasLoggedIn
        hasClaimedNft
      }
      nextToken
    }
  }
`;
export const getTokenSnapshot = /* GraphQL */ `
  query GetTokenSnapshot($id: ID!) {
    getTokenSnapshot(id: $id) {
      id
      ethereumAddress
      cswapBalance
      addressType
      createdAt
      updatedAt
    }
  }
`;
export const listTokenSnapshots = /* GraphQL */ `
  query ListTokenSnapshots(
    $filter: ModelTokenSnapshotFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTokenSnapshots(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        ethereumAddress
        cswapBalance
        addressType
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;
export const getAddressMapping = /* GraphQL */ `
  query GetAddressMapping($id: ID!) {
    getAddressMapping(id: $id) {
      id
      ethereumAddress
      cardanoAddress
      createdAt
      updatedAt
    }
  }
`;
export const listAddressMappings = /* GraphQL */ `
  query ListAddressMappings(
    $filter: ModelAddressMappingFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAddressMappings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        ethereumAddress
        cardanoAddress
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;
