import {
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  Flex,
  Grid,
  Heading,
  IconButton,
  Link,
  SimpleGrid,
  Skeleton,
  Text,
  Tooltip,
} from '@chakra-ui/core'
import constate from 'constate'
import { useEffect, useState } from 'react'
import { useEthContext } from '../contexts/ProviderContext'
import { LoadState, RiskLevel } from '../types'
import { pools } from '../utils/pool-data'
import { toDollar, toNumber } from '../utils/utils'
import { Card } from './Card'
import { useFilterSidebarContext } from './FilterSidebar'

const usePools = () => {
  const [pools, setPools] = useState([])
  const [filteredPools, setFilteredPools] = useState([])
  const [expandAll, setExpandAll] = useState(false)
  const [expandAllStateChanged, setExpandAllStateChanged] = useState(0)
  const [loadState, setLoadState] = useState(LoadState.LOADED)
  const [totalWeeklyRoi, setTotalWeeklyRoi] = useState(0)
  const [claimableRewards, setClaimableRewards] = useState([])

  const expandOrCollapseAll = (value: boolean) => {
    setExpandAllStateChanged(expandAllStateChanged + 1)
    setExpandAll(value)
  }

  return {
    pools,
    setPools,
    filteredPools,
    setFilteredPools,
    expandAll,
    expandAllStateChanged,
    expandOrCollapseAll,
    loadState,
    setLoadState,
    totalWeeklyRoi,
    setTotalWeeklyRoi,
    claimableRewards,
    setClaimableRewards,
  }
}
export const [PoolProvider, usePoolContext] = constate(usePools)

export const PoolSection: React.FC<{ prefetchedPools: any }> = ({
  prefetchedPools,
}) => {
  const { ethApp } = useEthContext()
  const {
    setPools,
    filteredPools,
    loadState,
    setLoadState,
    setTotalWeeklyRoi,
    setClaimableRewards,
  } = usePoolContext()
  const { onOpen } = useFilterSidebarContext()

  const sortByApr = (a, b) => parseFloat(b.apr) - parseFloat(a.apr)

  const getPoolInfo = async () => {
    if (ethApp && typeof window !== 'undefined') {
      setLoadState(LoadState.LOADING)

      const fetchedPools = []
      const claimableRewards = []
      let weeklyRoi = 0
      await Promise.all(
        Object.values(pools).map(
          (getPoolData) =>
            new Promise((resolve) => {
              ;(getPoolData(ethApp) as any)
                .then((data) => {
                  fetchedPools.push(data)
                  if (data?.ROIs[2]?.value && data?.staking[1]?.value) {
                    const roi =
                      (toNumber(data.ROIs[2].value) *
                        toNumber(data.staking[1].value)) /
                      100
                    weeklyRoi += roi
                  }
                  if (
                    data?.rewards[0]?.value &&
                    toNumber(data.rewards[0].value) > 10
                  ) {
                    claimableRewards.push(data.rewards[0])
                  }
                  resolve()
                })
                .catch((e) => {
                  console.error(e)
                  resolve()
                })
            })
        )
      )
      setTotalWeeklyRoi(weeklyRoi)
      setClaimableRewards(claimableRewards)
      setPools(fetchedPools)
      setLoadState(LoadState.LOADED)
    }
  }

  useEffect(() => {
    getPoolInfo()
  }, [ethApp])

  useEffect(() => {
    setPools(prefetchedPools)
  }, [prefetchedPools])

  return (
    <Box pt={{ xs: 1, lg: 4 }}>
      <Button
        onClick={onOpen}
        d={{ xs: 'block', lg: 'none' }}
        marginLeft="1rem"
        marginBottom="1rem"
        variantColor="teal"
      >
        Filters
      </Button>
      <Grid
        templateColumns={['1.5fr 1fr 1.2fr 0.2fr', '1fr 1.5fr 1.3fr 1fr 0.2fr']}
        marginX="2rem"
        marginBottom="0.3rem"
      >
        <Text
          d={{ xs: 'none', md: 'flex' }}
          color="gray.600"
          fontWeight="bold"
          alignItems="center"
        >
          Provider
        </Text>
        <Text
          color="gray.600"
          fontWeight="bold"
          display="flex"
          alignItems="center"
        >
          Pool
        </Text>
        <Text
          color="gray.600"
          fontWeight="bold"
          display="flex"
          alignItems="center"
        >
          Rewards
        </Text>
        <Text
          color="gray.600"
          fontWeight="bold"
          display="flex"
          alignItems="center"
        >
          APR
        </Text>
        <IconButton
          isLoading={loadState === LoadState.LOADING}
          onClick={getPoolInfo}
          aria-label="refresh"
          title="Refresh Pools"
          icon="repeat"
          variant="ghost"
          justifySelf="end"
          isRound={true}
        />
      </Grid>
      <Box mx="1rem">
        <Flex direction="column" justifyContent="center">
          {filteredPools.length > 0 ? (
            filteredPools
              ?.sort(sortByApr)
              ?.map((poolItemData, index) => (
                <PoolItem key={index} poolItemData={poolItemData} />
              ))
          ) : (
            <Card>
              <Text fontWeight="medium">
                No pools found using the selected criteria
              </Text>
            </Card>
          )}
        </Flex>
      </Box>
    </Box>
  )
}

const PoolItem = ({ poolItemData }) => {
  const { provider, name, poolRewards } = poolItemData
  const [show, setShow] = useState(false)
  const { expandAll, expandAllStateChanged } = usePoolContext()

  useEffect(() => {
    setShow(expandAll)
  }, [expandAllStateChanged])

  return (
    <Card boxShadow="sm" mx={0} mt={0}>
      <Grid
        templateColumns={['1.5fr 1fr 1.2fr 0.2fr', '1fr 1.5fr 1.3fr 1fr 0.2fr']}
        onClick={() => setShow(!show)}
        cursor="pointer"
      >
        <Text d={{ xs: 'none', md: 'flex' }} alignItems="center">
          {provider}
        </Text>
        <Text display="flex" alignItems="center">
          {name}
        </Text>
        <Box display="flex" alignItems="center">
          {poolRewards.map((reward) => (
            <Badge mx={1} key={reward}>
              {reward}
            </Badge>
          ))}
        </Box>
        <Text display="flex" alignItems="center">
          {poolItemData.apr ? (
            `${poolItemData.apr}%`
          ) : (
            <Skeleton height="20px" maxW={20} />
          )}
        </Text>
        <IconButton
          backgroundColor="white"
          justifySelf="end"
          variant="ghost"
          fontSize={20}
          onClick={() => setShow(!show)}
          isRound={true}
          aria-label="Show more"
          icon={show ? 'chevron-up' : 'chevron-down'}
        />
      </Grid>
      <Collapse mt={4} isOpen={show}>
        <Divider mb={4} />
        <SimpleGrid minChildWidth="212px" spacing={4} cursor="auto">
          <LinkList links={poolItemData.links || []} />
          <DetailItem title="Prices" data={poolItemData.prices} />
          <DetailItem title="ROI" data={poolItemData.ROIs} />
          {poolItemData.staking?.length > 0 && (
            <DetailItem title="Staking" data={poolItemData.staking} />
          )}
          {poolItemData.rewards?.length > 0 && (
            <DetailItem title="Claimable Rewards" data={poolItemData.rewards} />
          )}
          {typeof poolItemData.risk !== 'undefined' && (
            <RiskList data={poolItemData.risk} />
          )}
        </SimpleGrid>
      </Collapse>
    </Card>
  )
}

const riskColors = {
  [RiskLevel.NONE]: 'green.400',
  [RiskLevel.LOW]: 'green.400',
  [RiskLevel.MEDIUM]: 'orange.300',
  [RiskLevel.HIGH]: 'red.500',
  [RiskLevel.EXTREME]: 'red.700',
}

const RiskList = ({ data }) =>
  data ? (
    <Box>
      <Heading as="h4" size="sm" color="gray.600" pb={2}>
        Risk Levels
      </Heading>
      <Flex>
        <Box pr={5}>
          <Text pb=".1rem">Smart Contract</Text>
          <Text pb=".1rem">Impermanent Loss</Text>
        </Box>
        <Box>
          <Tooltip
            label={riskBlurbs.sc[data.smartContract]}
            aria-label={riskBlurbs.sc[data.smartContract]}
            bg="white"
            color="black"
            placement="right-end"
            p=".5rem"
          >
            <Text
              fontWeight="medium"
              pb=".1rem"
              color={riskColors[data.smartContract]}
              cursor="default"
            >
              {data.smartContract}
            </Text>
          </Tooltip>
          <Tooltip
            label={riskBlurbs.il[data.impermanentLoss]}
            aria-label={riskBlurbs.il[data.impermanentLoss]}
            bg="white"
            color="black"
            placement="right-end"
            p=".5rem"
          >
            <Text
              fontWeight="medium"
              pb=".1rem"
              color={riskColors[data.impermanentLoss]}
              cursor="default"
            >
              {data.impermanentLoss}
            </Text>
          </Tooltip>
        </Box>
      </Flex>
    </Box>
  ) : (
    <Box />
  )

const riskBlurbs = {
  il: {
    [RiskLevel.NONE]:
      'This contract is not a split pool, so there is no risk of impermanent loss.',
    [RiskLevel.MEDIUM]:
      'This is a unevenly split pool, impermanent loss can occur.',
    [RiskLevel.HIGH]: 'This is a split pool, impermanent loss can occur.',
  },
  sc: {
    [RiskLevel.LOW]: 'This smart contract has been professionally audited.',
    [RiskLevel.MEDIUM]:
      'This smart contract is based on a tested contract, but has not been audited.',
    [RiskLevel.HIGH]:
      'This smart contract is unaudited and experimental. Use at your own risk.',
  },
}

const LinkList = ({ links }) => (
  <Box>
    <Heading as="h4" size="sm" color="gray.600" pb={2}>
      Links
    </Heading>
    {links.map(({ title, link }) => (
      <Link href={link} d="block" key={title} isExternal>
        {title}
      </Link>
    ))}
  </Box>
)

const DetailItem = ({ title, data }) =>
  data && data.length > 0 ? (
    <Box>
      <Heading as="h4" size="sm" color="gray.600" pb={2}>
        {title}
      </Heading>
      <Flex>
        <Box pr={5}>
          {data.map(({ label }) => (
            <Text fontWeight="bold" key={label} pb=".1rem">
              {label}
            </Text>
          ))}
        </Box>
        <Box>
          {data.map(({ value }, index) => (
            <Text pb=".1rem" key={index}>
              {value}
            </Text>
          ))}
        </Box>
      </Flex>
    </Box>
  ) : null

export const EarningsCard = ({ ...props }) => {
  const { totalWeeklyRoi, claimableRewards } = usePoolContext()
  const rois = [
    {
      label: 'Hourly',
      value: toDollar(totalWeeklyRoi / 7 / 24),
    },
    {
      label: 'Daily',
      value: toDollar(totalWeeklyRoi / 7),
    },
    {
      label: 'Weekly',
      value: toDollar(totalWeeklyRoi),
    },
  ]
  return totalWeeklyRoi > 0 ? (
    <Box {...props}>
      <Text color="gray.600" fontWeight="bold" pt="1rem" pl="20px">
        Rewards
      </Text>
      <Card>
        <SimpleGrid minChildWidth="212px" spacing={4} cursor="auto">
          <DetailItem title="Your Estimated Earnings" data={rois} />
          <DetailItem title="Your Claimable Rewards" data={claimableRewards} />
        </SimpleGrid>
      </Card>
    </Box>
  ) : null
}
