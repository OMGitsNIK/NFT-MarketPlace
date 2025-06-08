import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import NFTBox from "./NFTBox"
import Link from "next/link"

interface NFTItem {
    rindexerId: string
    nftAddress: string
    nodeId: string
    price: string
    seller: string
    tokenId: string
    contractAddress: string
    txHash: string
    blockNumber: string
}

interface BoughtCancelled {
    nftAddress: string
    tokenId: string
}

interface NFTQueryResponse {
    data: {
        AllItemsListeds: {
            nodes: NFTItem[]
        }
        allItemBoughts: {
            nodes: NFTItem[]
        }
        allItemCanceleds: {
            nodes: NFTItem[]
        }
    }
}

const GET_RECENT_NFTS = `
query AllItemListeds {
  allItemListeds(first: 20, orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
    nodes {
      rindexerId
      nftAddress
      nodeId
      price
      seller
      tokenId
      contractAddress
      txHash
      blockNumber
    }
  }
  allItemCanceleds {
    nodes {
      tokenId
      nftAddress
    }
  }
  allItemBoughts {
    nodes {
      tokenId
      nftAddress
    }
  }
}`

async function fetchNFTs(): Promise<NFTQueryResponse> {
    const response = await fetch("/api/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: GET_RECENT_NFTS,
        }),
    })
    return response.json()
}
console.log(await fetchNFTs())

function useRecentlyListedNFTs() {
    const { data, isLoading, error } = useQuery<NFTQueryResponse>({
        queryKey: ["recentNFTs"],
        queryFn: fetchNFTs,
    })
    const nftDataList = useMemo(() => {
        if (!data) return []

        const boughtNFTs = new Set<string>()
        const cancelledNFTs = new Set<string>()

        data.data.allItemBoughts.nodes.forEach(item => {
            boughtNFTs.add(`${item.nftAddress}-${item.tokenId}`)
        })
        data.data.allItemCanceleds.nodes.forEach(item => {
            cancelledNFTs.add(`${item.nftAddress}-${item.tokenId}`)
        })

        const availNfts = data.data.AllItemsListeds.nodes.filter(item => {
            if (!item.nftAddress || !item.tokenId) return false
            const key = `${item.nftAddress}-${item.tokenId}`
            return !boughtNFTs.has(key) && !cancelledNFTs.has(key)
        })

        const recentNfts = availNfts.slice(0, 100)
        return recentNfts.map(nft => ({
            tokenId: nft.tokenId,
            contractAddress: nft.contractAddress,
            price: nft.price,
        }))
    }, [data])

    return { isLoading, error, nftDataList }
}

// Main component that uses the custom hook
export default function RecentlyListedNFTs() {
    const { isLoading, error, nftDataList } = useRecentlyListedNFTs()

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mt-8 text-center">
                <Link
                    href="/list-nft"
                    className="inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    List Your NFT
                </Link>
            </div>
            <h2 className="text-2xl font-bold mb-6">Recently Listed NFTs</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {nftDataList.map(nft => (
                    <Link
                        href={`/buy-nft/${nft.contractAddress}/${nft.tokenId}`}
                        key={`${nft.contractAddress}-${nft.tokenId}`}
                    >
                        <NFTBox
                            key={`${nft.contractAddress}-${nft.tokenId}`}
                            tokenId={nft.tokenId}
                            contractAddress={nft.contractAddress}
                            price={nft.price}
                        />
                    </Link>
                ))}
            </div>
        </div>
    )
}
