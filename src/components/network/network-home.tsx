import type { NetworkHomeViewModel } from "@/application/network/get-network-home";
import { NetworkHomeExplore } from "@/components/network/network-home-explore";

type NetworkHomeProps = NetworkHomeViewModel;

export function NetworkHome(props: NetworkHomeProps) {
  return <NetworkHomeExplore {...props} />;
}
