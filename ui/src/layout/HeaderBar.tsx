import { Menubar } from 'primereact/menubar';
import { MenuItem } from 'primereact/menuitem';
import { logout, userInfoStore } from '../core/api/Shared';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/react.svg';


export const HeaderBar = () => {

    const userInfo = userInfoStore.use()
    const navigate = useNavigate()

    const items: MenuItem[] = [
        {
            label: 'Home',
            icon: 'pi pi-home',
            command: () => navigate('/'),
        },
        {
            label: 'Login',
            icon: 'pi pi-star',
            command: () => navigate('/security/login'),
        },
        {
            label: 'Admin',
            icon: 'pi pi-user',
            items: [
                {
                    label: 'Roles',
                    icon: 'pi pi-bolt',
                    command: () => navigate('/security/role-list'),
                },
                {
                    label: 'User',
                    icon: 'pi pi-user',
                    command: () => navigate('/security/user-list'),
                },
                {
                    label: 'Blocks',
                    icon: 'pi pi-server'
                },
                {
                    label: 'UI Kit',
                    icon: 'pi pi-pencil'
                }, 
                {
                    label: 'Product',
                    icon: 'pi pi-palette',
                    items: [
                        {
                            label: 'Products',
                            icon: 'pi pi-palette',
                            command: () => navigate('/product/product-list'),
                        },
                        {
                            label: 'Sellers',
                            icon: 'pi pi-palette',
                            command: () => navigate('/product/seller-list'),
                        }
                    ]
                }
            ]
        },
        {
            label: 'Contact',
            icon: 'pi pi-envelope'
        }
    ];


    const isAnonymous = !userInfo.data?.email


    const logo = <img alt="logo" src={logoImg} height="32" className='mt-2'></img>;

    const rightMenu = <>
        <div className="flex align-items-center ">
            <span className="p-2">{userInfo.data?.userName ?? 'Anónimo'} </span>
            {
                isAnonymous
                    ? <Button label="login" className="mr-1 p-2" icon="pi pi-sign-in" iconPos="right" onClick={() => navigate("/security/login")} />
                    : <Button label="logout" className="mr-1 p-2" icon="pi pi-power-off" iconPos="right" onClick={() => logout()} />
            }
        </div>
    </>

    return (
        <Menubar model={items}
            className='bg-white-alpha-10 w-full border-none border-noround border-bottom-2 p-1 shadow-4'
            start={logo}
            end={rightMenu}
        />
    );
};
