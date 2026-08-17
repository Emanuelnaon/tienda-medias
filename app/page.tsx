import { GrillaProductos } from '@/src/features/catalogo/components/GrillaProductos';
import {TablaProductos} from '@/src/features/admin/components/TablaProductos';
export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const params = await searchParams; 
  return <GrillaProductos parametros={params} />;
}
