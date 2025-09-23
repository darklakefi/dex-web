import { redirect } from "next/navigation";

interface ReferralPageProps {
	params: Promise<{ code: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ReferralPage({
	params,
	searchParams,
}: ReferralPageProps) {
	const { code } = await params;
	const search = await searchParams;

	if (!code || typeof code !== "string" || code.length < 3) {
		redirect("/");
	}

	const urlSearchParams = new URLSearchParams();
	urlSearchParams.set("ref", code);

	Object.entries(search).forEach(([key, value]) => {
		if (key !== "ref" && value) {
			const stringValue = Array.isArray(value) ? value[0] : value;
			if (stringValue) {
				urlSearchParams.set(key, stringValue);
			}
		}
	});

	const redirectUrl = `/?${urlSearchParams.toString()}`;
	redirect(redirectUrl);
}