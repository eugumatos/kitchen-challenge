import RestaurantIcon from '@mui/icons-material/Restaurant';
import TakeoutDiningIcon from '@mui/icons-material/TakeoutDining';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { TYPE_LABELS, humanize } from './presentation';

const ICONS: Record<string, typeof RestaurantIcon> = {
  dine_in: RestaurantIcon,
  takeout: TakeoutDiningIcon,
  delivery: DeliveryDiningIcon,
};

export function OrderTypeTile({ type }: { type: string }) {
  const Icon = ICONS[type] ?? ReceiptLongIcon;
  return (
    <div className="type-tile">
      <span className="type-tile__icon">
        <Icon fontSize="small" aria-hidden />
      </span>
      <span className="type-tile__label">{TYPE_LABELS[type] ?? humanize(type)}</span>
    </div>
  );
}
