import { ethers } from "ethers";

// Replace with your actual contract ABI and address
import GuardianBadgeABI from "@/lib/abis/GuardianBadge.json";
const GUARDIAN_BADGE_ADDRESS = process.env.NEXT_PUBLIC_GUARDIAN_BADGE_ADDRESS;

export class EmergencyContactsService {
  static getProvider() {
    if (!process.env.NEXT_PUBLIC_RPC_URL) {
      throw new Error('NEXT_PUBLIC_RPC_URL not configured');
    }
    return new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  }

  static getContract(signerOrProvider?: ethers.Signer | ethers.providers.Provider) {
    if (!GUARDIAN_BADGE_ADDRESS) {
      throw new Error('NEXT_PUBLIC_GUARDIAN_BADGE_ADDRESS not configured');
    }
    return new ethers.Contract(
      GUARDIAN_BADGE_ADDRESS,
      GuardianBadgeABI,
      signerOrProvider || this.getProvider()
    );
  }

  static async getContacts(): Promise<string[]> {
    try {
      const contract = this.getContract();
      const contacts = await contract.getEmergencyContacts();
      // Convert addresses to strings
      return contacts.map((addr: string) => addr.toLowerCase());
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      throw error;
    }
  }

  static async addContact(contact: string, signer: ethers.Signer): Promise<any> {
    const contract = this.getContract(signer);
    const tx = await contract.addEmergencyContact(contact);
    return tx.wait();
  }

  static async removeContact(contact: string, signer: ethers.Signer): Promise<any> {
    const contract = this.getContract(signer);
    const tx = await contract.removeEmergencyContact(contact);
    return tx.wait();
  }
}
