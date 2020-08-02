import {
  get_synth_weekly_rewards,
  lookUpPrices,
  toFixed,
  toDollar,
} from '../../../utils'
import { ethers } from 'ethers'
import {
  MUSD_WETH_BPT_TOKEN_ADDR,
  BALANCER_POOL_ABI,
  ERC20_ABI,
  WETH_TOKEN_ADDR,
  MUSD_TOKEN_ADDR,
} from '../../../constants'

export default async function main(App) {
  const MUSD_WETH_BALANCER_POOL = new ethers.Contract(
    MUSD_WETH_BPT_TOKEN_ADDR,
    BALANCER_POOL_ABI,
    App.provider
  )
  const MUSD_WETH_BPT_TOKEN_CONTRACT = new ethers.Contract(
    MUSD_WETH_BPT_TOKEN_ADDR,
    ERC20_ABI,
    App.provider
  )

  const totalBPTAmount = (await MUSD_WETH_BALANCER_POOL.totalSupply()) / 1e18
  const yourBPTAmount =
    (await MUSD_WETH_BPT_TOKEN_CONTRACT.balanceOf(App.YOUR_ADDRESS)) / 1e18

  const totalWETHAmount =
    (await MUSD_WETH_BALANCER_POOL.getBalance(WETH_TOKEN_ADDR)) / 1e18
  const totalMUSDAmount =
    (await MUSD_WETH_BALANCER_POOL.getBalance(MUSD_TOKEN_ADDR)) / 1e18

  const WETHPerBPT = totalWETHAmount / totalBPTAmount
  const MUSDPerBPT = totalMUSDAmount / totalBPTAmount

  // Find out reward rate
  const weekly_reward = 50000
  const MTARewardPerBPT = weekly_reward / totalBPTAmount

  // Look up prices
  const prices = await lookUpPrices(['musd', 'meta', 'weth'])
  const MTAPrice = prices['meta'].usd
  const MUSDPrice = prices['musd'].usd
  const WETHPrice = prices['weth'].usd

  const BPTPrice = WETHPerBPT * WETHPrice + MUSDPerBPT * MUSDPrice

  // Finished. Start printing

  const WeeklyROI = (MTARewardPerBPT * MTAPrice * 100) / BPTPrice

  return {
    apr: toFixed(WeeklyROI * 52, 4),
    prices: [
      { label: 'MTA', value: toDollar(MTAPrice) },
      { label: 'mUSD', value: toDollar(MUSDPrice) },
      { label: 'WETH', value: toDollar(WETHPrice) },
    ],
    staking: [
      {
        label: 'Pool Total',
        value: toDollar(totalBPTAmount * BPTPrice),
      },
      {
        label: 'Your Total',
        value: toDollar(yourBPTAmount * BPTPrice),
      },
    ],
    rewards: [],
    ROIs: [
      {
        label: 'Hourly',
        value: `${toFixed(WeeklyROI / 7 / 24, 4)}%`,
      },
      {
        label: 'Daily',
        value: `${toFixed(WeeklyROI / 7, 4)}%`,
      },
      {
        label: 'Weekly',
        value: `${toFixed(WeeklyROI, 4)}%`,
      },
    ],
    links: [
      {
        title: 'Info',
        link: 'https://medium.com/mstable/a-recap-of-mta-rewards-9729356a66dd',
      },
      {
        title: 'Balancer Pool',
        link:
          'https://pools.balancer.exchange/#/pool/0xe036CCE08cf4E23D33bC6B18e53Caf532AFa8513',
      },
    ],
  }
}
