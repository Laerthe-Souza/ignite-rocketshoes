import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: productAmountStocked } = await api.get(`/stock/${productId}`);

      const productAlreadyExists = cart.find(product => product.id === productId);

      if (productAmountStocked.amount === productAlreadyExists?.amount) {
        toast.error('Quantidade solicitada fora de estoque');

        return;
      }

      if (productAlreadyExists) {
        const newProducts = cart.map(product => product.id === productId ? {
          ...product,
          amount: product.amount + 1,
        } : {
          ...product,
        });
  
        setCart(newProducts);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProducts));
  
        return;
      }

      const { data } = await api.get(`/products/${productId}`);

      const newProduct = {
        ...data,
        amount: 1,
      };

      setCart(allProducts => [...allProducts, newProduct]);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const deletedProduct = cart.find(product => product.id === productId);

      if (!deletedProduct) {
        throw new Error('Erro na remoção do produto');
      } else {
        const newProducts = cart.filter(product => product.id !== productId);

        setCart(newProducts);
  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProducts));
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount === 0) {
        return;
      }

      const { data: productAmountStocked } = await api.get(`/stock/${productId}`);

      if (amount > productAmountStocked.amount) {
        toast.error('Quantidade solicitada fora de estoque');

        return;
      }

      const newProducts = cart.map(product => product.id === productId ? {
        ...product,
        amount,
      } : {
        ...product,
      });

      setCart(newProducts);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProducts));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
