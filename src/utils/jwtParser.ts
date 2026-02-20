import { UserData } from "@/stores/authStore";

export const parseJwtToken = (newToken: string | undefined | null): string | undefined => {
  if (!newToken) return undefined;
  
  let s = String(newToken).trim();
  if (s.toLowerCase().startsWith('bearer ')) s = s.split(' ')[1];
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1);
  return s || undefined;
};

export const decodeAndMapUserFromToken = (token: string, baseUser: UserData): UserData | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decodedToken = JSON.parse(jsonPayload);

    // Helper to safely parse numbers
    const getNumber = (key: string, fallback: number) => {
      const v = decodedToken[key];
      if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
      return fallback;
    };

    const flower = getNumber('flower', Number(baseUser.flower ?? 0));
    const heart = getNumber('heart', Number(baseUser.heart ?? 0));
    const stamp = getNumber('stamp', Number(baseUser.stamp ?? 0));
    const coupon = getNumber('coupon', Number(baseUser.coupon ?? 0));

    // Check multiple keys for coin
    const coinRaw = decodedToken.coin ?? decodedToken.coins ?? decodedToken.goldCoins ?? decodedToken.gold_coin;
    const coin = (coinRaw !== undefined && coinRaw !== null && !Number.isNaN(Number(coinRaw)))
      ? Number(coinRaw)
      : Number(baseUser.coin ?? 0);

    // Check multiple keys for freecoin
    const freecoinRaw = decodedToken.freecoin ?? decodedToken.free_coin;
    const freecoin = (freecoinRaw !== undefined && freecoinRaw !== null && !Number.isNaN(Number(freecoinRaw)))
      ? Number(freecoinRaw)
      : Number(baseUser.freecoin ?? 0);
    const exp = getNumber('exp_point', Number(baseUser.exp ?? 0)); // Token key is exp_point based on JSON
    
    // Prioritize userId from token as confirmed by debugging
    const userIdRaw = decodedToken.userId ?? decodedToken.user_id ?? decodedToken.id ?? decodedToken.sub;
    const user_id = (userIdRaw !== undefined && userIdRaw !== null && !Number.isNaN(Number(userIdRaw)))
      ? Number(userIdRaw)
      : Number(baseUser.user_id ?? 0);

    const updatedUser: UserData = {
      ...baseUser,
      user_id: user_id,

      writer_name: decodedToken.writer_name !== undefined ? decodedToken.writer_name : baseUser.writer_name,
      fullname: decodedToken.fullname !== undefined ? decodedToken.fullname : baseUser.fullname,
      email: decodedToken.email !== undefined ? decodedToken.email : baseUser.email,

      // Map fields (ยอมรับ null)
      phone: decodedToken.phone !== undefined ? decodedToken.phone : baseUser.phone,
      address_main: decodedToken.address_main !== undefined ? decodedToken.address_main : baseUser.address_main,
      des: decodedToken.des !== undefined ? decodedToken.des : baseUser.des,
      facebook: decodedToken.facebook !== undefined ? decodedToken.facebook : baseUser.facebook,
      twitter: decodedToken.twitter !== undefined ? decodedToken.twitter : baseUser.twitter,
      gender: decodedToken.gender !== undefined ? decodedToken.gender : baseUser.gender,
      birthday: decodedToken.birthday !== undefined ? decodedToken.birthday : baseUser.birthday,
      cat1: decodedToken.cat1 !== undefined ? decodedToken.cat1 : baseUser.cat1,
      cat2: decodedToken.cat2 !== undefined ? decodedToken.cat2 : baseUser.cat2,

      // Images & Frames (ยอมรับ null)
      banner: decodedToken.banner !== undefined ? decodedToken.banner : baseUser.banner,
      img: decodedToken.img !== undefined ? decodedToken.img : baseUser.img,

      frame_id: decodedToken.frame_id !== undefined ? decodedToken.frame_id : baseUser.frame_id,
      aka_id: decodedToken.aka_id !== undefined ? decodedToken.aka_id : baseUser.aka_id,
      frame: decodedToken.frame !== undefined ? decodedToken.frame : baseUser.frame,
      aka: decodedToken.aka !== undefined ? decodedToken.aka : baseUser.aka,

      flower, heart, stamp, coupon, coin, freecoin, exp,
    };

    return updatedUser;
  } catch (error) {
    console.error("Failed to map UserData from token", error);
    return null;
  }
};
