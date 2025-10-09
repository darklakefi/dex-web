/* eslint-disable */

import type { Message } from "@bufbuild/protobuf";
import type {
  GenEnum,
  GenFile,
  GenMessage,
  GenService,
} from "@bufbuild/protobuf/codegenv2";
import {
  enumDesc,
  fileDesc,
  messageDesc,
  serviceDesc,
} from "@bufbuild/protobuf/codegenv2";
import { file_validate_validate } from "./validate/validate_pb";

/**
 * Describes the file api.proto.
 */
export const file_api: GenFile = fileDesc(
  "CglhcGkucHJvdG8SC2RhcmtsYWtlLnYxImIKDVRva2VuTWV0YWRhdGESDAoEbmFtZRgBIAEoCRIOCgZzeW1ib2wYAiABKAkSEAoIZGVjaW1hbHMYAyABKA0SEAoIbG9nb191cmkYBCABKAkSDwoHYWRkcmVzcxgFIAEoCSLHAgoFVHJhZGUSEAoIdHJhZGVfaWQYASABKAkSEAoIb3JkZXJfaWQYAiABKAkSFAoMdXNlcl9hZGRyZXNzGAMgASgJEisKB3Rva2VuX3gYBCABKAsyGi5kYXJrbGFrZS52MS5Ub2tlbk1ldGFkYXRhEisKB3Rva2VuX3kYBSABKAsyGi5kYXJrbGFrZS52MS5Ub2tlbk1ldGFkYXRhEhEKCWFtb3VudF9pbhgGIAEoBBIaChJtaW5pbWFsX2Ftb3VudF9vdXQYByABKAQSKAoGc3RhdHVzGAggASgOMhguZGFya2xha2UudjEuVHJhZGVTdGF0dXMSEQoJc2lnbmF0dXJlGAkgASgJEhIKCmNyZWF0ZWRfYXQYCiABKAMSEgoKdXBkYXRlZF9hdBgLIAEoAxIWCg5pc19zd2FwX3hfdG9feRgMIAEoCCKkAQoMUXVvdGVSZXF1ZXN0Ei8KDHRva2VuX21pbnRfeBgBIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJBIvCgx0b2tlbl9taW50X3kYAiABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQSGgoJYW1vdW50X2luGAMgASgEQgf6QgQyAiAAEhYKDmlzX3N3YXBfeF90b195GAQgASgIIp8BCg1RdW90ZVJlc3BvbnNlEhQKDHRva2VuX21pbnRfeBgBIAEoCRIUCgx0b2tlbl9taW50X3kYAiABKAkSFgoOaXNfc3dhcF94X3RvX3kYAyABKAgSEQoJYW1vdW50X2luGAQgASgEEhIKCmFtb3VudF9vdXQYBSABKAQSEgoKZmVlX2Ftb3VudBgGIAEoBBIPCgdmZWVfcGN0GAcgASgBIuACCiBDcmVhdGVVbnNpZ25lZFRyYW5zYWN0aW9uUmVxdWVzdBIvCgx1c2VyX2FkZHJlc3MYASABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQSLwoMdG9rZW5fbWludF94GAIgASgJQhn6QhZyFBABGCwyDl5bQS1aYS16MC05XSskEi8KDHRva2VuX21pbnRfeRgDIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJBIaCglhbW91bnRfaW4YBCABKARCB/pCBDICIAASGAoHbWluX291dBgFIAEoBEIH+kIEMgIgABIfCgt0cmFja2luZ19pZBgGIAEoCUIK+kIHcgUQARj6ARIWCg5pc19zd2FwX3hfdG9feRgHIAEoCBIQCghyZWZfY29kZRgIIAEoCRIoCgVsYWJlbBgJIAEoCUIZ+kIWchQYCjIQXltBLVphLXowLTlfLV0qJCJ3CiFDcmVhdGVVbnNpZ25lZFRyYW5zYWN0aW9uUmVzcG9uc2USHAoUdW5zaWduZWRfdHJhbnNhY3Rpb24YASABKAkSEAoIb3JkZXJfaWQYAiABKAkSEAoIdHJhZGVfaWQYAyABKAkSEAoIcmVmX2NvZGUYBCABKAkiqAEKHFNlbmRTaWduZWRUcmFuc2FjdGlvblJlcXVlc3QSOAoSc2lnbmVkX3RyYW5zYWN0aW9uGAEgASgJQhz6QhlyFxABMhNeW0EtWmEtejAtOSsvPV8tXSokEh8KC3RyYWNraW5nX2lkGAIgASgJQgr6QgdyBRABGPoBEi0KCHRyYWRlX2lkGAMgASgJQhv6QhhyFhABGPoBMg9eW0EtWmEtejAtOV9dKiQiVgodU2VuZFNpZ25lZFRyYW5zYWN0aW9uUmVzcG9uc2USDwoHc3VjY2VzcxgBIAEoCBIQCgh0cmFkZV9pZBgCIAEoCRISCgplcnJvcl9sb2dzGAMgAygJImkKF0NoZWNrVHJhZGVTdGF0dXNSZXF1ZXN0Eh8KC3RyYWNraW5nX2lkGAEgASgJQgr6QgdyBRABGPoBEi0KCHRyYWRlX2lkGAIgASgJQhv6QhhyFhABGPoBMg9eW0EtWmEtejAtOV9dKiQiVgoYQ2hlY2tUcmFkZVN0YXR1c1Jlc3BvbnNlEhAKCHRyYWRlX2lkGAEgASgJEigKBnN0YXR1cxgCIAEoDjIYLmRhcmtsYWtlLnYxLlRyYWRlU3RhdHVzInUKGkdldFRyYWRlc0xpc3RCeVVzZXJSZXF1ZXN0Ei8KDHVzZXJfYWRkcmVzcxgBIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJBIRCglwYWdlX3NpemUYAiABKAUSEwoLcGFnZV9udW1iZXIYAyABKAUibAobR2V0VHJhZGVzTGlzdEJ5VXNlclJlc3BvbnNlEiIKBnRyYWRlcxgBIAMoCzISLmRhcmtsYWtlLnYxLlRyYWRlEhMKC3RvdGFsX3BhZ2VzGAIgASgFEhQKDGN1cnJlbnRfcGFnZRgDIAEoBSLBAQoXR2V0VG9rZW5NZXRhZGF0YVJlcXVlc3QSMgoNdG9rZW5fYWRkcmVzcxgBIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJEgAEiIKDHRva2VuX3N5bWJvbBgCIAEoCUIK+kIHcgUQARj6AUgAEiAKCnRva2VuX25hbWUYAyABKAlCCvpCB3IFEAEY+gFIABIfCglzdWJzdHJpbmcYBCABKAlCCvpCB3IFEAEY+gFIAEILCglzZWFyY2hfYnkiTgoYR2V0VG9rZW5NZXRhZGF0YVJlc3BvbnNlEjIKDnRva2VuX21ldGFkYXRhGAEgASgLMhouZGFya2xha2UudjEuVG9rZW5NZXRhZGF0YSJPChJUb2tlbkFkZHJlc3Nlc0xpc3QSOQoPdG9rZW5fYWRkcmVzc2VzGAEgAygJQiD6Qh2SARoIASIWchQQARgsMg5eW0EtWmEtejAtOV0rJCI8ChBUb2tlblN5bWJvbHNMaXN0EigKDXRva2VuX3N5bWJvbHMYASADKAlCEfpCDpIBCwgBIgdyBRABGPoBIjgKDlRva2VuTmFtZXNMaXN0EiYKC3Rva2VuX25hbWVzGAEgAygJQhH6Qg6SAQsIASIHcgUQARj6ASKYAgobR2V0VG9rZW5NZXRhZGF0YUxpc3RSZXF1ZXN0EjkKDmFkZHJlc3Nlc19saXN0GAEgASgLMh8uZGFya2xha2UudjEuVG9rZW5BZGRyZXNzZXNMaXN0SAASNQoMc3ltYm9sc19saXN0GAIgASgLMh0uZGFya2xha2UudjEuVG9rZW5TeW1ib2xzTGlzdEgAEjEKCm5hbWVzX2xpc3QYAyABKAsyGy5kYXJrbGFrZS52MS5Ub2tlbk5hbWVzTGlzdEgAEh8KCXN1YnN0cmluZxgGIAEoCUIK+kIHcgUQARj6AUgAEhEKCXBhZ2Vfc2l6ZRgEIAEoBRITCgtwYWdlX251bWJlchgFIAEoBUILCglmaWx0ZXJfYnkidQocR2V0VG9rZW5NZXRhZGF0YUxpc3RSZXNwb25zZRIqCgZ0b2tlbnMYASADKAsyGi5kYXJrbGFrZS52MS5Ub2tlbk1ldGFkYXRhEhMKC3RvdGFsX3BhZ2VzGAIgASgFEhQKDGN1cnJlbnRfcGFnZRgDIAEoBSK1AQoYQ3JlYXRlQ3VzdG9tVG9rZW5SZXF1ZXN0EhgKBG5hbWUYASABKAlCCvpCB3IFEAEY+gESGgoGc3ltYm9sGAIgASgJQgr6QgdyBRABGPoBEhkKCGRlY2ltYWxzGAMgASgNQgf6QgQqAhgSEhwKCGxvZ29fdXJpGAQgASgJQgr6QgdyBRABGPQDEioKB2FkZHJlc3MYBSABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQicQoZQ3JlYXRlQ3VzdG9tVG9rZW5SZXNwb25zZRIPCgdzdWNjZXNzGAEgASgIEg8KB21lc3NhZ2UYAiABKAkSMgoOdG9rZW5fbWV0YWRhdGEYAyABKAsyGi5kYXJrbGFrZS52MS5Ub2tlbk1ldGFkYXRhIrMBChZFZGl0Q3VzdG9tVG9rZW5SZXF1ZXN0EioKB2FkZHJlc3MYASABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQSGAoEbmFtZRgCIAEoCUIK+kIHcgUQARj6ARIaCgZzeW1ib2wYAyABKAlCCvpCB3IFEAEY+gESGQoIZGVjaW1hbHMYBCABKA1CB/pCBCoCGBISHAoIbG9nb191cmkYBSABKAlCCvpCB3IFEAEY9AMibwoXRWRpdEN1c3RvbVRva2VuUmVzcG9uc2USDwoHc3VjY2VzcxgBIAEoCBIPCgdtZXNzYWdlGAIgASgJEjIKDnRva2VuX21ldGFkYXRhGAMgASgLMhouZGFya2xha2UudjEuVG9rZW5NZXRhZGF0YSJGChhEZWxldGVDdXN0b21Ub2tlblJlcXVlc3QSKgoHYWRkcmVzcxgBIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJCI9ChlEZWxldGVDdXN0b21Ub2tlblJlc3BvbnNlEg8KB3N1Y2Nlc3MYASABKAgSDwoHbWVzc2FnZRgCIAEoCSIYChZHZXRDdXN0b21Ub2tlbnNSZXF1ZXN0IkUKF0dldEN1c3RvbVRva2Vuc1Jlc3BvbnNlEioKBnRva2VucxgBIAMoCzIaLmRhcmtsYWtlLnYxLlRva2VuTWV0YWRhdGEiQwoVR2V0Q3VzdG9tVG9rZW5SZXF1ZXN0EioKB2FkZHJlc3MYASABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQiTAoWR2V0Q3VzdG9tVG9rZW5SZXNwb25zZRIyCg50b2tlbl9tZXRhZGF0YRgBIAEoCzIaLmRhcmtsYWtlLnYxLlRva2VuTWV0YWRhdGEi+wEKD0luaXRQb29sUmVxdWVzdBIvCgx0b2tlbl9taW50X3gYASABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQSLwoMdG9rZW5fbWludF95GAIgASgJQhn6QhZyFBABGCwyDl5bQS1aYS16MC05XSskEi8KDHVzZXJfYWRkcmVzcxgDIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJBIZCghhbW91bnRfeBgEIAEoBEIH+kIEMgIgABIZCghhbW91bnRfeRgFIAEoBEIH+kIEMgIgABIQCghyZWZfY29kZRgGIAEoCRINCgVsYWJlbBgHIAEoCSIwChBJbml0UG9vbFJlc3BvbnNlEhwKFHVuc2lnbmVkX3RyYW5zYWN0aW9uGAEgASgJIqMCChNBZGRMaXF1aWRpdHlSZXF1ZXN0Ei8KDHRva2VuX21pbnRfeBgBIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJBIvCgx0b2tlbl9taW50X3kYAiABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQSLwoMdXNlcl9hZGRyZXNzGAMgASgJQhn6QhZyFBABGCwyDl5bQS1aYS16MC05XSskEhoKCWFtb3VudF9scBgEIAEoBEIH+kIEMgIgABIdCgxtYXhfYW1vdW50X3gYBSABKARCB/pCBDICIAASHQoMbWF4X2Ftb3VudF95GAYgASgEQgf6QgQyAiAAEhAKCHJlZl9jb2RlGAcgASgJEg0KBWxhYmVsGAggASgJIjQKFEFkZExpcXVpZGl0eVJlc3BvbnNlEhwKFHVuc2lnbmVkX3RyYW5zYWN0aW9uGAEgASgJIqYCChZSZW1vdmVMaXF1aWRpdHlSZXF1ZXN0Ei8KDHRva2VuX21pbnRfeBgBIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJBIvCgx0b2tlbl9taW50X3kYAiABKAlCGfpCFnIUEAEYLDIOXltBLVphLXowLTldKyQSLwoMdXNlcl9hZGRyZXNzGAMgASgJQhn6QhZyFBABGCwyDl5bQS1aYS16MC05XSskEhoKCWFtb3VudF9scBgEIAEoBEIH+kIEMgIgABIdCgxtaW5fYW1vdW50X3gYBSABKARCB/pCBDICIAASHQoMbWluX2Ftb3VudF95GAYgASgEQgf6QgQyAiAAEhAKCHJlZl9jb2RlGAcgASgJEg0KBWxhYmVsGAggASgJIjcKF1JlbW92ZUxpcXVpZGl0eVJlc3BvbnNlEhwKFHVuc2lnbmVkX3RyYW5zYWN0aW9uGAEgASgJIucBChhRdW90ZUFkZExpcXVpZGl0eVJlcXVlc3QSLwoMdG9rZW5fbWludF94GAEgASgJQhn6QhZyFBABGCwyDl5bQS1aYS16MC05XSskEi8KDHRva2VuX21pbnRfeRgCIAEoCUIZ+kIWchQQARgsMg5eW0EtWmEtejAtOV0rJBIfCg50b2tlbl94X2Ftb3VudBgDIAEoBEIH+kIEMgIgABIfCg50b2tlbl95X2Ftb3VudBgEIAEoBEIH+kIEMgIgABInChJzbGlwcGFnZV90b2xlcmFuY2UYBSABKARCC/pCCDIGEMCEPSgAInAKGVF1b3RlQWRkTGlxdWlkaXR5UmVzcG9uc2USFwoPbHBfdG9rZW5fYW1vdW50GAEgASgEEhkKEWxwX3Rva2VuX2RlY2ltYWxzGAIgASgEEh8KF2xwX3Rva2VuX2Ftb3VudF9kaXNwbGF5GAMgASgBKjQKB05ldHdvcmsSEAoMTUFJTk5FVF9CRVRBEAASCwoHVEVTVE5FVBABEgoKBkRFVk5FVBACKmsKC1RyYWRlU3RhdHVzEgwKCFVOU0lHTkVEEAASCgoGU0lHTkVEEAESDQoJQ09ORklSTUVEEAISCwoHU0VUVExFRBADEgsKB1NMQVNIRUQQBBINCglDQU5DRUxMRUQQBRIKCgZGQUlMRUQQBjKaDAoUU29sYW5hR2F0ZXdheVNlcnZpY2USegoZQ3JlYXRlVW5zaWduZWRUcmFuc2FjdGlvbhItLmRhcmtsYWtlLnYxLkNyZWF0ZVVuc2lnbmVkVHJhbnNhY3Rpb25SZXF1ZXN0Gi4uZGFya2xha2UudjEuQ3JlYXRlVW5zaWduZWRUcmFuc2FjdGlvblJlc3BvbnNlEm4KFVNlbmRTaWduZWRUcmFuc2FjdGlvbhIpLmRhcmtsYWtlLnYxLlNlbmRTaWduZWRUcmFuc2FjdGlvblJlcXVlc3QaKi5kYXJrbGFrZS52MS5TZW5kU2lnbmVkVHJhbnNhY3Rpb25SZXNwb25zZRJfChBDaGVja1RyYWRlU3RhdHVzEiQuZGFya2xha2UudjEuQ2hlY2tUcmFkZVN0YXR1c1JlcXVlc3QaJS5kYXJrbGFrZS52MS5DaGVja1RyYWRlU3RhdHVzUmVzcG9uc2USaAoTR2V0VHJhZGVzTGlzdEJ5VXNlchInLmRhcmtsYWtlLnYxLkdldFRyYWRlc0xpc3RCeVVzZXJSZXF1ZXN0GiguZGFya2xha2UudjEuR2V0VHJhZGVzTGlzdEJ5VXNlclJlc3BvbnNlEl8KEEdldFRva2VuTWV0YWRhdGESJC5kYXJrbGFrZS52MS5HZXRUb2tlbk1ldGFkYXRhUmVxdWVzdBolLmRhcmtsYWtlLnYxLkdldFRva2VuTWV0YWRhdGFSZXNwb25zZRJrChRHZXRUb2tlbk1ldGFkYXRhTGlzdBIoLmRhcmtsYWtlLnYxLkdldFRva2VuTWV0YWRhdGFMaXN0UmVxdWVzdBopLmRhcmtsYWtlLnYxLkdldFRva2VuTWV0YWRhdGFMaXN0UmVzcG9uc2USYgoRQ3JlYXRlQ3VzdG9tVG9rZW4SJS5kYXJrbGFrZS52MS5DcmVhdGVDdXN0b21Ub2tlblJlcXVlc3QaJi5kYXJrbGFrZS52MS5DcmVhdGVDdXN0b21Ub2tlblJlc3BvbnNlElwKD0VkaXRDdXN0b21Ub2tlbhIjLmRhcmtsYWtlLnYxLkVkaXRDdXN0b21Ub2tlblJlcXVlc3QaJC5kYXJrbGFrZS52MS5FZGl0Q3VzdG9tVG9rZW5SZXNwb25zZRJiChFEZWxldGVDdXN0b21Ub2tlbhIlLmRhcmtsYWtlLnYxLkRlbGV0ZUN1c3RvbVRva2VuUmVxdWVzdBomLmRhcmtsYWtlLnYxLkRlbGV0ZUN1c3RvbVRva2VuUmVzcG9uc2USXAoPR2V0Q3VzdG9tVG9rZW5zEiMuZGFya2xha2UudjEuR2V0Q3VzdG9tVG9rZW5zUmVxdWVzdBokLmRhcmtsYWtlLnYxLkdldEN1c3RvbVRva2Vuc1Jlc3BvbnNlElkKDkdldEN1c3RvbVRva2VuEiIuZGFya2xha2UudjEuR2V0Q3VzdG9tVG9rZW5SZXF1ZXN0GiMuZGFya2xha2UudjEuR2V0Q3VzdG9tVG9rZW5SZXNwb25zZRJHCghJbml0UG9vbBIcLmRhcmtsYWtlLnYxLkluaXRQb29sUmVxdWVzdBodLmRhcmtsYWtlLnYxLkluaXRQb29sUmVzcG9uc2USUwoMQWRkTGlxdWlkaXR5EiAuZGFya2xha2UudjEuQWRkTGlxdWlkaXR5UmVxdWVzdBohLmRhcmtsYWtlLnYxLkFkZExpcXVpZGl0eVJlc3BvbnNlElwKD1JlbW92ZUxpcXVpZGl0eRIjLmRhcmtsYWtlLnYxLlJlbW92ZUxpcXVpZGl0eVJlcXVlc3QaJC5kYXJrbGFrZS52MS5SZW1vdmVMaXF1aWRpdHlSZXNwb25zZRI+CgVRdW90ZRIZLmRhcmtsYWtlLnYxLlF1b3RlUmVxdWVzdBoaLmRhcmtsYWtlLnYxLlF1b3RlUmVzcG9uc2USYgoRUXVvdGVBZGRMaXF1aWRpdHkSJS5kYXJrbGFrZS52MS5RdW90ZUFkZExpcXVpZGl0eVJlcXVlc3QaJi5kYXJrbGFrZS52MS5RdW90ZUFkZExpcXVpZGl0eVJlc3BvbnNlMvQGChtEYXJrbGFrZUludGVncmF0aW9uc1NlcnZpY2USPgoFUXVvdGUSGS5kYXJrbGFrZS52MS5RdW90ZVJlcXVlc3QaGi5kYXJrbGFrZS52MS5RdW90ZVJlc3BvbnNlEnoKGUNyZWF0ZVVuc2lnbmVkVHJhbnNhY3Rpb24SLS5kYXJrbGFrZS52MS5DcmVhdGVVbnNpZ25lZFRyYW5zYWN0aW9uUmVxdWVzdBouLmRhcmtsYWtlLnYxLkNyZWF0ZVVuc2lnbmVkVHJhbnNhY3Rpb25SZXNwb25zZRJuChVTZW5kU2lnbmVkVHJhbnNhY3Rpb24SKS5kYXJrbGFrZS52MS5TZW5kU2lnbmVkVHJhbnNhY3Rpb25SZXF1ZXN0GiouZGFya2xha2UudjEuU2VuZFNpZ25lZFRyYW5zYWN0aW9uUmVzcG9uc2USXwoQQ2hlY2tUcmFkZVN0YXR1cxIkLmRhcmtsYWtlLnYxLkNoZWNrVHJhZGVTdGF0dXNSZXF1ZXN0GiUuZGFya2xha2UudjEuQ2hlY2tUcmFkZVN0YXR1c1Jlc3BvbnNlEmgKE0dldFRyYWRlc0xpc3RCeVVzZXISJy5kYXJrbGFrZS52MS5HZXRUcmFkZXNMaXN0QnlVc2VyUmVxdWVzdBooLmRhcmtsYWtlLnYxLkdldFRyYWRlc0xpc3RCeVVzZXJSZXNwb25zZRJHCghJbml0UG9vbBIcLmRhcmtsYWtlLnYxLkluaXRQb29sUmVxdWVzdBodLmRhcmtsYWtlLnYxLkluaXRQb29sUmVzcG9uc2USUwoMQWRkTGlxdWlkaXR5EiAuZGFya2xha2UudjEuQWRkTGlxdWlkaXR5UmVxdWVzdBohLmRhcmtsYWtlLnYxLkFkZExpcXVpZGl0eVJlc3BvbnNlElwKD1JlbW92ZUxpcXVpZGl0eRIjLmRhcmtsYWtlLnYxLlJlbW92ZUxpcXVpZGl0eVJlcXVlc3QaJC5kYXJrbGFrZS52MS5SZW1vdmVMaXF1aWRpdHlSZXNwb25zZRJiChFRdW90ZUFkZExpcXVpZGl0eRIlLmRhcmtsYWtlLnYxLlF1b3RlQWRkTGlxdWlkaXR5UmVxdWVzdBomLmRhcmtsYWtlLnYxLlF1b3RlQWRkTGlxdWlkaXR5UmVzcG9uc2ViBnByb3RvMw",
  [file_validate_validate],
);

/**
 * --------------------------------- MESSAGES
 *
 * @generated from message darklake.v1.TokenMetadata
 */
export type TokenMetadata = Message<"darklake.v1.TokenMetadata"> & {
  /**
   * @generated from field: string name = 1;
   */
  name: string;

  /**
   * @generated from field: string symbol = 2;
   */
  symbol: string;

  /**
   * @generated from field: uint32 decimals = 3;
   */
  decimals: number;

  /**
   * @generated from field: string logo_uri = 4;
   */
  logoUri: string;

  /**
   * @generated from field: string address = 5;
   */
  address: string;
};

/**
 * Describes the message darklake.v1.TokenMetadata.
 * Use `create(TokenMetadataSchema)` to create a new message.
 */
export const TokenMetadataSchema: GenMessage<TokenMetadata> = messageDesc(
  file_api,
  0,
);

/**
 * @generated from message darklake.v1.Trade
 */
export type Trade = Message<"darklake.v1.Trade"> & {
  /**
   * @generated from field: string trade_id = 1;
   */
  tradeId: string;

  /**
   * @generated from field: string order_id = 2;
   */
  orderId: string;

  /**
   * @generated from field: string user_address = 3;
   */
  userAddress: string;

  /**
   * @generated from field: darklake.v1.TokenMetadata token_x = 4;
   */
  tokenX?: TokenMetadata;

  /**
   * @generated from field: darklake.v1.TokenMetadata token_y = 5;
   */
  tokenY?: TokenMetadata;

  /**
   * @generated from field: uint64 amount_in = 6;
   */
  amountIn: bigint;

  /**
   * @generated from field: uint64 minimal_amount_out = 7;
   */
  minimalAmountOut: bigint;

  /**
   * @generated from field: darklake.v1.TradeStatus status = 8;
   */
  status: TradeStatus;

  /**
   * @generated from field: string signature = 9;
   */
  signature: string;

  /**
   * @generated from field: int64 created_at = 10;
   */
  createdAt: bigint;

  /**
   * @generated from field: int64 updated_at = 11;
   */
  updatedAt: bigint;

  /**
   * @generated from field: bool is_swap_x_to_y = 12;
   */
  isSwapXToY: boolean;
};

/**
 * Describes the message darklake.v1.Trade.
 * Use `create(TradeSchema)` to create a new message.
 */
export const TradeSchema: GenMessage<Trade> = messageDesc(file_api, 1);

/**
 * @generated from message darklake.v1.QuoteRequest
 */
export type QuoteRequest = Message<"darklake.v1.QuoteRequest"> & {
  /**
   * @generated from field: string token_mint_x = 1;
   */
  tokenMintX: string;

  /**
   * @generated from field: string token_mint_y = 2;
   */
  tokenMintY: string;

  /**
   * @generated from field: uint64 amount_in = 3;
   */
  amountIn: bigint;

  /**
   * @generated from field: bool is_swap_x_to_y = 4;
   */
  isSwapXToY: boolean;
};

/**
 * Describes the message darklake.v1.QuoteRequest.
 * Use `create(QuoteRequestSchema)` to create a new message.
 */
export const QuoteRequestSchema: GenMessage<QuoteRequest> = messageDesc(
  file_api,
  2,
);

/**
 * @generated from message darklake.v1.QuoteResponse
 */
export type QuoteResponse = Message<"darklake.v1.QuoteResponse"> & {
  /**
   * @generated from field: string token_mint_x = 1;
   */
  tokenMintX: string;

  /**
   * @generated from field: string token_mint_y = 2;
   */
  tokenMintY: string;

  /**
   * @generated from field: bool is_swap_x_to_y = 3;
   */
  isSwapXToY: boolean;

  /**
   * @generated from field: uint64 amount_in = 4;
   */
  amountIn: bigint;

  /**
   * @generated from field: uint64 amount_out = 5;
   */
  amountOut: bigint;

  /**
   * @generated from field: uint64 fee_amount = 6;
   */
  feeAmount: bigint;

  /**
   * @generated from field: double fee_pct = 7;
   */
  feePct: number;
};

/**
 * Describes the message darklake.v1.QuoteResponse.
 * Use `create(QuoteResponseSchema)` to create a new message.
 */
export const QuoteResponseSchema: GenMessage<QuoteResponse> = messageDesc(
  file_api,
  3,
);

/**
 * @generated from message darklake.v1.CreateUnsignedTransactionRequest
 */
export type CreateUnsignedTransactionRequest =
  Message<"darklake.v1.CreateUnsignedTransactionRequest"> & {
    /**
     * @generated from field: string user_address = 1;
     */
    userAddress: string;

    /**
     * @generated from field: string token_mint_x = 2;
     */
    tokenMintX: string;

    /**
     * @generated from field: string token_mint_y = 3;
     */
    tokenMintY: string;

    /**
     * @generated from field: uint64 amount_in = 4;
     */
    amountIn: bigint;

    /**
     * @generated from field: uint64 min_out = 5;
     */
    minOut: bigint;

    /**
     * @generated from field: string tracking_id = 6;
     */
    trackingId: string;

    /**
     * @generated from field: bool is_swap_x_to_y = 7;
     */
    isSwapXToY: boolean;

    /**
     * @generated from field: string ref_code = 8;
     */
    refCode: string;

    /**
     * @generated from field: string label = 9;
     */
    label: string;
  };

/**
 * Describes the message darklake.v1.CreateUnsignedTransactionRequest.
 * Use `create(CreateUnsignedTransactionRequestSchema)` to create a new message.
 */
export const CreateUnsignedTransactionRequestSchema: GenMessage<CreateUnsignedTransactionRequest> =
  messageDesc(file_api, 4);

/**
 * @generated from message darklake.v1.CreateUnsignedTransactionResponse
 */
export type CreateUnsignedTransactionResponse =
  Message<"darklake.v1.CreateUnsignedTransactionResponse"> & {
    /**
     * Base64 encoded transaction
     *
     * @generated from field: string unsigned_transaction = 1;
     */
    unsignedTransaction: string;

    /**
     * @generated from field: string order_id = 2;
     */
    orderId: string;

    /**
     * @generated from field: string trade_id = 3;
     */
    tradeId: string;

    /**
     * @generated from field: string ref_code = 4;
     */
    refCode: string;
  };

/**
 * Describes the message darklake.v1.CreateUnsignedTransactionResponse.
 * Use `create(CreateUnsignedTransactionResponseSchema)` to create a new message.
 */
export const CreateUnsignedTransactionResponseSchema: GenMessage<CreateUnsignedTransactionResponse> =
  messageDesc(file_api, 5);

/**
 * @generated from message darklake.v1.SendSignedTransactionRequest
 */
export type SendSignedTransactionRequest =
  Message<"darklake.v1.SendSignedTransactionRequest"> & {
    /**
     * @generated from field: string signed_transaction = 1;
     */
    signedTransaction: string;

    /**
     * @generated from field: string tracking_id = 2;
     */
    trackingId: string;

    /**
     * @generated from field: string trade_id = 3;
     */
    tradeId: string;
  };

/**
 * Describes the message darklake.v1.SendSignedTransactionRequest.
 * Use `create(SendSignedTransactionRequestSchema)` to create a new message.
 */
export const SendSignedTransactionRequestSchema: GenMessage<SendSignedTransactionRequest> =
  messageDesc(file_api, 6);

/**
 * @generated from message darklake.v1.SendSignedTransactionResponse
 */
export type SendSignedTransactionResponse =
  Message<"darklake.v1.SendSignedTransactionResponse"> & {
    /**
     * @generated from field: bool success = 1;
     */
    success: boolean;

    /**
     * @generated from field: string trade_id = 2;
     */
    tradeId: string;

    /**
     * @generated from field: repeated string error_logs = 3;
     */
    errorLogs: string[];
  };

/**
 * Describes the message darklake.v1.SendSignedTransactionResponse.
 * Use `create(SendSignedTransactionResponseSchema)` to create a new message.
 */
export const SendSignedTransactionResponseSchema: GenMessage<SendSignedTransactionResponse> =
  messageDesc(file_api, 7);

/**
 * @generated from message darklake.v1.CheckTradeStatusRequest
 */
export type CheckTradeStatusRequest =
  Message<"darklake.v1.CheckTradeStatusRequest"> & {
    /**
     * @generated from field: string tracking_id = 1;
     */
    trackingId: string;

    /**
     * @generated from field: string trade_id = 2;
     */
    tradeId: string;
  };

/**
 * Describes the message darklake.v1.CheckTradeStatusRequest.
 * Use `create(CheckTradeStatusRequestSchema)` to create a new message.
 */
export const CheckTradeStatusRequestSchema: GenMessage<CheckTradeStatusRequest> =
  messageDesc(file_api, 8);

/**
 * @generated from message darklake.v1.CheckTradeStatusResponse
 */
export type CheckTradeStatusResponse =
  Message<"darklake.v1.CheckTradeStatusResponse"> & {
    /**
     * @generated from field: string trade_id = 1;
     */
    tradeId: string;

    /**
     * @generated from field: darklake.v1.TradeStatus status = 2;
     */
    status: TradeStatus;
  };

/**
 * Describes the message darklake.v1.CheckTradeStatusResponse.
 * Use `create(CheckTradeStatusResponseSchema)` to create a new message.
 */
export const CheckTradeStatusResponseSchema: GenMessage<CheckTradeStatusResponse> =
  messageDesc(file_api, 9);

/**
 * @generated from message darklake.v1.GetTradesListByUserRequest
 */
export type GetTradesListByUserRequest =
  Message<"darklake.v1.GetTradesListByUserRequest"> & {
    /**
     * @generated from field: string user_address = 1;
     */
    userAddress: string;

    /**
     * @generated from field: int32 page_size = 2;
     */
    pageSize: number;

    /**
     * @generated from field: int32 page_number = 3;
     */
    pageNumber: number;
  };

/**
 * Describes the message darklake.v1.GetTradesListByUserRequest.
 * Use `create(GetTradesListByUserRequestSchema)` to create a new message.
 */
export const GetTradesListByUserRequestSchema: GenMessage<GetTradesListByUserRequest> =
  messageDesc(file_api, 10);

/**
 * @generated from message darklake.v1.GetTradesListByUserResponse
 */
export type GetTradesListByUserResponse =
  Message<"darklake.v1.GetTradesListByUserResponse"> & {
    /**
     * @generated from field: repeated darklake.v1.Trade trades = 1;
     */
    trades: Trade[];

    /**
     * @generated from field: int32 total_pages = 2;
     */
    totalPages: number;

    /**
     * @generated from field: int32 current_page = 3;
     */
    currentPage: number;
  };

/**
 * Describes the message darklake.v1.GetTradesListByUserResponse.
 * Use `create(GetTradesListByUserResponseSchema)` to create a new message.
 */
export const GetTradesListByUserResponseSchema: GenMessage<GetTradesListByUserResponse> =
  messageDesc(file_api, 11);

/**
 * @generated from message darklake.v1.GetTokenMetadataRequest
 */
export type GetTokenMetadataRequest =
  Message<"darklake.v1.GetTokenMetadataRequest"> & {
    /**
     * @generated from oneof darklake.v1.GetTokenMetadataRequest.search_by
     */
    searchBy:
      | {
          /**
           * @generated from field: string token_address = 1;
           */
          value: string;
          case: "tokenAddress";
        }
      | {
          /**
           * @generated from field: string token_symbol = 2;
           */
          value: string;
          case: "tokenSymbol";
        }
      | {
          /**
           * @generated from field: string token_name = 3;
           */
          value: string;
          case: "tokenName";
        }
      | {
          /**
           * @generated from field: string substring = 4;
           */
          value: string;
          case: "substring";
        }
      | { case: undefined; value?: undefined };
  };

/**
 * Describes the message darklake.v1.GetTokenMetadataRequest.
 * Use `create(GetTokenMetadataRequestSchema)` to create a new message.
 */
export const GetTokenMetadataRequestSchema: GenMessage<GetTokenMetadataRequest> =
  messageDesc(file_api, 12);

/**
 * @generated from message darklake.v1.GetTokenMetadataResponse
 */
export type GetTokenMetadataResponse =
  Message<"darklake.v1.GetTokenMetadataResponse"> & {
    /**
     * @generated from field: darklake.v1.TokenMetadata token_metadata = 1;
     */
    tokenMetadata?: TokenMetadata;
  };

/**
 * Describes the message darklake.v1.GetTokenMetadataResponse.
 * Use `create(GetTokenMetadataResponseSchema)` to create a new message.
 */
export const GetTokenMetadataResponseSchema: GenMessage<GetTokenMetadataResponse> =
  messageDesc(file_api, 13);

/**
 * @generated from message darklake.v1.TokenAddressesList
 */
export type TokenAddressesList = Message<"darklake.v1.TokenAddressesList"> & {
  /**
   * @generated from field: repeated string token_addresses = 1;
   */
  tokenAddresses: string[];
};

/**
 * Describes the message darklake.v1.TokenAddressesList.
 * Use `create(TokenAddressesListSchema)` to create a new message.
 */
export const TokenAddressesListSchema: GenMessage<TokenAddressesList> =
  messageDesc(file_api, 14);

/**
 * @generated from message darklake.v1.TokenSymbolsList
 */
export type TokenSymbolsList = Message<"darklake.v1.TokenSymbolsList"> & {
  /**
   * @generated from field: repeated string token_symbols = 1;
   */
  tokenSymbols: string[];
};

/**
 * Describes the message darklake.v1.TokenSymbolsList.
 * Use `create(TokenSymbolsListSchema)` to create a new message.
 */
export const TokenSymbolsListSchema: GenMessage<TokenSymbolsList> = messageDesc(
  file_api,
  15,
);

/**
 * @generated from message darklake.v1.TokenNamesList
 */
export type TokenNamesList = Message<"darklake.v1.TokenNamesList"> & {
  /**
   * @generated from field: repeated string token_names = 1;
   */
  tokenNames: string[];
};

/**
 * Describes the message darklake.v1.TokenNamesList.
 * Use `create(TokenNamesListSchema)` to create a new message.
 */
export const TokenNamesListSchema: GenMessage<TokenNamesList> = messageDesc(
  file_api,
  16,
);

/**
 * @generated from message darklake.v1.GetTokenMetadataListRequest
 */
export type GetTokenMetadataListRequest =
  Message<"darklake.v1.GetTokenMetadataListRequest"> & {
    /**
     * @generated from oneof darklake.v1.GetTokenMetadataListRequest.filter_by
     */
    filterBy:
      | {
          /**
           * @generated from field: darklake.v1.TokenAddressesList addresses_list = 1;
           */
          value: TokenAddressesList;
          case: "addressesList";
        }
      | {
          /**
           * @generated from field: darklake.v1.TokenSymbolsList symbols_list = 2;
           */
          value: TokenSymbolsList;
          case: "symbolsList";
        }
      | {
          /**
           * @generated from field: darklake.v1.TokenNamesList names_list = 3;
           */
          value: TokenNamesList;
          case: "namesList";
        }
      | {
          /**
           * @generated from field: string substring = 6;
           */
          value: string;
          case: "substring";
        }
      | { case: undefined; value?: undefined };

    /**
     * @generated from field: int32 page_size = 4;
     */
    pageSize: number;

    /**
     * @generated from field: int32 page_number = 5;
     */
    pageNumber: number;
  };

/**
 * Describes the message darklake.v1.GetTokenMetadataListRequest.
 * Use `create(GetTokenMetadataListRequestSchema)` to create a new message.
 */
export const GetTokenMetadataListRequestSchema: GenMessage<GetTokenMetadataListRequest> =
  messageDesc(file_api, 17);

/**
 * @generated from message darklake.v1.GetTokenMetadataListResponse
 */
export type GetTokenMetadataListResponse =
  Message<"darklake.v1.GetTokenMetadataListResponse"> & {
    /**
     * @generated from field: repeated darklake.v1.TokenMetadata tokens = 1;
     */
    tokens: TokenMetadata[];

    /**
     * @generated from field: int32 total_pages = 2;
     */
    totalPages: number;

    /**
     * @generated from field: int32 current_page = 3;
     */
    currentPage: number;
  };

/**
 * Describes the message darklake.v1.GetTokenMetadataListResponse.
 * Use `create(GetTokenMetadataListResponseSchema)` to create a new message.
 */
export const GetTokenMetadataListResponseSchema: GenMessage<GetTokenMetadataListResponse> =
  messageDesc(file_api, 18);

/**
 * Custom Token Management Messages
 *
 * @generated from message darklake.v1.CreateCustomTokenRequest
 */
export type CreateCustomTokenRequest =
  Message<"darklake.v1.CreateCustomTokenRequest"> & {
    /**
     * @generated from field: string name = 1;
     */
    name: string;

    /**
     * @generated from field: string symbol = 2;
     */
    symbol: string;

    /**
     * @generated from field: uint32 decimals = 3;
     */
    decimals: number;

    /**
     * @generated from field: string logo_uri = 4;
     */
    logoUri: string;

    /**
     * @generated from field: string address = 5;
     */
    address: string;
  };

/**
 * Describes the message darklake.v1.CreateCustomTokenRequest.
 * Use `create(CreateCustomTokenRequestSchema)` to create a new message.
 */
export const CreateCustomTokenRequestSchema: GenMessage<CreateCustomTokenRequest> =
  messageDesc(file_api, 19);

/**
 * @generated from message darklake.v1.CreateCustomTokenResponse
 */
export type CreateCustomTokenResponse =
  Message<"darklake.v1.CreateCustomTokenResponse"> & {
    /**
     * @generated from field: bool success = 1;
     */
    success: boolean;

    /**
     * @generated from field: string message = 2;
     */
    message: string;

    /**
     * @generated from field: darklake.v1.TokenMetadata token_metadata = 3;
     */
    tokenMetadata?: TokenMetadata;
  };

/**
 * Describes the message darklake.v1.CreateCustomTokenResponse.
 * Use `create(CreateCustomTokenResponseSchema)` to create a new message.
 */
export const CreateCustomTokenResponseSchema: GenMessage<CreateCustomTokenResponse> =
  messageDesc(file_api, 20);

/**
 * @generated from message darklake.v1.EditCustomTokenRequest
 */
export type EditCustomTokenRequest =
  Message<"darklake.v1.EditCustomTokenRequest"> & {
    /**
     * @generated from field: string address = 1;
     */
    address: string;

    /**
     * @generated from field: string name = 2;
     */
    name: string;

    /**
     * @generated from field: string symbol = 3;
     */
    symbol: string;

    /**
     * @generated from field: uint32 decimals = 4;
     */
    decimals: number;

    /**
     * @generated from field: string logo_uri = 5;
     */
    logoUri: string;
  };

/**
 * Describes the message darklake.v1.EditCustomTokenRequest.
 * Use `create(EditCustomTokenRequestSchema)` to create a new message.
 */
export const EditCustomTokenRequestSchema: GenMessage<EditCustomTokenRequest> =
  messageDesc(file_api, 21);

/**
 * @generated from message darklake.v1.EditCustomTokenResponse
 */
export type EditCustomTokenResponse =
  Message<"darklake.v1.EditCustomTokenResponse"> & {
    /**
     * @generated from field: bool success = 1;
     */
    success: boolean;

    /**
     * @generated from field: string message = 2;
     */
    message: string;

    /**
     * @generated from field: darklake.v1.TokenMetadata token_metadata = 3;
     */
    tokenMetadata?: TokenMetadata;
  };

/**
 * Describes the message darklake.v1.EditCustomTokenResponse.
 * Use `create(EditCustomTokenResponseSchema)` to create a new message.
 */
export const EditCustomTokenResponseSchema: GenMessage<EditCustomTokenResponse> =
  messageDesc(file_api, 22);

/**
 * @generated from message darklake.v1.DeleteCustomTokenRequest
 */
export type DeleteCustomTokenRequest =
  Message<"darklake.v1.DeleteCustomTokenRequest"> & {
    /**
     * @generated from field: string address = 1;
     */
    address: string;
  };

/**
 * Describes the message darklake.v1.DeleteCustomTokenRequest.
 * Use `create(DeleteCustomTokenRequestSchema)` to create a new message.
 */
export const DeleteCustomTokenRequestSchema: GenMessage<DeleteCustomTokenRequest> =
  messageDesc(file_api, 23);

/**
 * @generated from message darklake.v1.DeleteCustomTokenResponse
 */
export type DeleteCustomTokenResponse =
  Message<"darklake.v1.DeleteCustomTokenResponse"> & {
    /**
     * @generated from field: bool success = 1;
     */
    success: boolean;

    /**
     * @generated from field: string message = 2;
     */
    message: string;
  };

/**
 * Describes the message darklake.v1.DeleteCustomTokenResponse.
 * Use `create(DeleteCustomTokenResponseSchema)` to create a new message.
 */
export const DeleteCustomTokenResponseSchema: GenMessage<DeleteCustomTokenResponse> =
  messageDesc(file_api, 24);

/**
 * @generated from message darklake.v1.GetCustomTokensRequest
 */
export type GetCustomTokensRequest =
  Message<"darklake.v1.GetCustomTokensRequest"> & {};

/**
 * Describes the message darklake.v1.GetCustomTokensRequest.
 * Use `create(GetCustomTokensRequestSchema)` to create a new message.
 */
export const GetCustomTokensRequestSchema: GenMessage<GetCustomTokensRequest> =
  messageDesc(file_api, 25);

/**
 * @generated from message darklake.v1.GetCustomTokensResponse
 */
export type GetCustomTokensResponse =
  Message<"darklake.v1.GetCustomTokensResponse"> & {
    /**
     * @generated from field: repeated darklake.v1.TokenMetadata tokens = 1;
     */
    tokens: TokenMetadata[];
  };

/**
 * Describes the message darklake.v1.GetCustomTokensResponse.
 * Use `create(GetCustomTokensResponseSchema)` to create a new message.
 */
export const GetCustomTokensResponseSchema: GenMessage<GetCustomTokensResponse> =
  messageDesc(file_api, 26);

/**
 * @generated from message darklake.v1.GetCustomTokenRequest
 */
export type GetCustomTokenRequest =
  Message<"darklake.v1.GetCustomTokenRequest"> & {
    /**
     * @generated from field: string address = 1;
     */
    address: string;
  };

/**
 * Describes the message darklake.v1.GetCustomTokenRequest.
 * Use `create(GetCustomTokenRequestSchema)` to create a new message.
 */
export const GetCustomTokenRequestSchema: GenMessage<GetCustomTokenRequest> =
  messageDesc(file_api, 27);

/**
 * @generated from message darklake.v1.GetCustomTokenResponse
 */
export type GetCustomTokenResponse =
  Message<"darklake.v1.GetCustomTokenResponse"> & {
    /**
     * @generated from field: darklake.v1.TokenMetadata token_metadata = 1;
     */
    tokenMetadata?: TokenMetadata;
  };

/**
 * Describes the message darklake.v1.GetCustomTokenResponse.
 * Use `create(GetCustomTokenResponseSchema)` to create a new message.
 */
export const GetCustomTokenResponseSchema: GenMessage<GetCustomTokenResponse> =
  messageDesc(file_api, 28);

/**
 * @generated from message darklake.v1.InitPoolRequest
 */
export type InitPoolRequest = Message<"darklake.v1.InitPoolRequest"> & {
  /**
   * @generated from field: string token_mint_x = 1;
   */
  tokenMintX: string;

  /**
   * @generated from field: string token_mint_y = 2;
   */
  tokenMintY: string;

  /**
   * @generated from field: string user_address = 3;
   */
  userAddress: string;

  /**
   * @generated from field: uint64 amount_x = 4;
   */
  amountX: bigint;

  /**
   * @generated from field: uint64 amount_y = 5;
   */
  amountY: bigint;

  /**
   * @generated from field: string ref_code = 6;
   */
  refCode: string;

  /**
   * @generated from field: string label = 7;
   */
  label: string;
};

/**
 * Describes the message darklake.v1.InitPoolRequest.
 * Use `create(InitPoolRequestSchema)` to create a new message.
 */
export const InitPoolRequestSchema: GenMessage<InitPoolRequest> = messageDesc(
  file_api,
  29,
);

/**
 * @generated from message darklake.v1.InitPoolResponse
 */
export type InitPoolResponse = Message<"darklake.v1.InitPoolResponse"> & {
  /**
   * Base64 encoded transaction
   *
   * @generated from field: string unsigned_transaction = 1;
   */
  unsignedTransaction: string;
};

/**
 * Describes the message darklake.v1.InitPoolResponse.
 * Use `create(InitPoolResponseSchema)` to create a new message.
 */
export const InitPoolResponseSchema: GenMessage<InitPoolResponse> = messageDesc(
  file_api,
  30,
);

/**
 * @generated from message darklake.v1.AddLiquidityRequest
 */
export type AddLiquidityRequest = Message<"darklake.v1.AddLiquidityRequest"> & {
  /**
   * @generated from field: string token_mint_x = 1;
   */
  tokenMintX: string;

  /**
   * @generated from field: string token_mint_y = 2;
   */
  tokenMintY: string;

  /**
   * @generated from field: string user_address = 3;
   */
  userAddress: string;

  /**
   * @generated from field: uint64 amount_lp = 4;
   */
  amountLp: bigint;

  /**
   * @generated from field: uint64 max_amount_x = 5;
   */
  maxAmountX: bigint;

  /**
   * @generated from field: uint64 max_amount_y = 6;
   */
  maxAmountY: bigint;

  /**
   * @generated from field: string ref_code = 7;
   */
  refCode: string;

  /**
   * @generated from field: string label = 8;
   */
  label: string;
};

/**
 * Describes the message darklake.v1.AddLiquidityRequest.
 * Use `create(AddLiquidityRequestSchema)` to create a new message.
 */
export const AddLiquidityRequestSchema: GenMessage<AddLiquidityRequest> =
  messageDesc(file_api, 31);

/**
 * @generated from message darklake.v1.AddLiquidityResponse
 */
export type AddLiquidityResponse =
  Message<"darklake.v1.AddLiquidityResponse"> & {
    /**
     * Base64 encoded transaction
     *
     * @generated from field: string unsigned_transaction = 1;
     */
    unsignedTransaction: string;
  };

/**
 * Describes the message darklake.v1.AddLiquidityResponse.
 * Use `create(AddLiquidityResponseSchema)` to create a new message.
 */
export const AddLiquidityResponseSchema: GenMessage<AddLiquidityResponse> =
  messageDesc(file_api, 32);

/**
 * @generated from message darklake.v1.RemoveLiquidityRequest
 */
export type RemoveLiquidityRequest =
  Message<"darklake.v1.RemoveLiquidityRequest"> & {
    /**
     * @generated from field: string token_mint_x = 1;
     */
    tokenMintX: string;

    /**
     * @generated from field: string token_mint_y = 2;
     */
    tokenMintY: string;

    /**
     * @generated from field: string user_address = 3;
     */
    userAddress: string;

    /**
     * @generated from field: uint64 amount_lp = 4;
     */
    amountLp: bigint;

    /**
     * @generated from field: uint64 min_amount_x = 5;
     */
    minAmountX: bigint;

    /**
     * @generated from field: uint64 min_amount_y = 6;
     */
    minAmountY: bigint;

    /**
     * @generated from field: string ref_code = 7;
     */
    refCode: string;

    /**
     * @generated from field: string label = 8;
     */
    label: string;
  };

/**
 * Describes the message darklake.v1.RemoveLiquidityRequest.
 * Use `create(RemoveLiquidityRequestSchema)` to create a new message.
 */
export const RemoveLiquidityRequestSchema: GenMessage<RemoveLiquidityRequest> =
  messageDesc(file_api, 33);

/**
 * @generated from message darklake.v1.RemoveLiquidityResponse
 */
export type RemoveLiquidityResponse =
  Message<"darklake.v1.RemoveLiquidityResponse"> & {
    /**
     * Base64 encoded transaction
     *
     * @generated from field: string unsigned_transaction = 1;
     */
    unsignedTransaction: string;
  };

/**
 * Describes the message darklake.v1.RemoveLiquidityResponse.
 * Use `create(RemoveLiquidityResponseSchema)` to create a new message.
 */
export const RemoveLiquidityResponseSchema: GenMessage<RemoveLiquidityResponse> =
  messageDesc(file_api, 34);

/**
 * @generated from message darklake.v1.QuoteAddLiquidityRequest
 */
export type QuoteAddLiquidityRequest =
  Message<"darklake.v1.QuoteAddLiquidityRequest"> & {
    /**
     * @generated from field: string token_mint_x = 1;
     */
    tokenMintX: string;

    /**
     * @generated from field: string token_mint_y = 2;
     */
    tokenMintY: string;

    /**
     * @generated from field: uint64 token_x_amount = 3;
     */
    tokenXAmount: bigint;

    /**
     * @generated from field: uint64 token_y_amount = 4;
     */
    tokenYAmount: bigint;

    /**
     * @generated from field: uint64 slippage_tolerance = 5;
     */
    slippageTolerance: bigint;
  };

/**
 * Describes the message darklake.v1.QuoteAddLiquidityRequest.
 * Use `create(QuoteAddLiquidityRequestSchema)` to create a new message.
 */
export const QuoteAddLiquidityRequestSchema: GenMessage<QuoteAddLiquidityRequest> =
  messageDesc(file_api, 35);

/**
 * @generated from message darklake.v1.QuoteAddLiquidityResponse
 */
export type QuoteAddLiquidityResponse =
  Message<"darklake.v1.QuoteAddLiquidityResponse"> & {
    /**
     * @generated from field: uint64 lp_token_amount = 1;
     */
    lpTokenAmount: bigint;

    /**
     * @generated from field: uint64 lp_token_decimals = 2;
     */
    lpTokenDecimals: bigint;

    /**
     * @generated from field: double lp_token_amount_display = 3;
     */
    lpTokenAmountDisplay: number;
  };

/**
 * Describes the message darklake.v1.QuoteAddLiquidityResponse.
 * Use `create(QuoteAddLiquidityResponseSchema)` to create a new message.
 */
export const QuoteAddLiquidityResponseSchema: GenMessage<QuoteAddLiquidityResponse> =
  messageDesc(file_api, 36);

/**
 * @generated from enum darklake.v1.Network
 */
export enum Network {
  /**
   * @generated from enum value: MAINNET_BETA = 0;
   */
  MAINNET_BETA = 0,

  /**
   * @generated from enum value: TESTNET = 1;
   */
  TESTNET = 1,

  /**
   * @generated from enum value: DEVNET = 2;
   */
  DEVNET = 2,
}

/**
 * Describes the enum darklake.v1.Network.
 */
export const NetworkSchema: GenEnum<Network> = enumDesc(file_api, 0);

/**
 * @generated from enum darklake.v1.TradeStatus
 */
export enum TradeStatus {
  /**
   * @generated from enum value: UNSIGNED = 0;
   */
  UNSIGNED = 0,

  /**
   * @generated from enum value: SIGNED = 1;
   */
  SIGNED = 1,

  /**
   * @generated from enum value: CONFIRMED = 2;
   */
  CONFIRMED = 2,

  /**
   * @generated from enum value: SETTLED = 3;
   */
  SETTLED = 3,

  /**
   * @generated from enum value: SLASHED = 4;
   */
  SLASHED = 4,

  /**
   * @generated from enum value: CANCELLED = 5;
   */
  CANCELLED = 5,

  /**
   * @generated from enum value: FAILED = 6;
   */
  FAILED = 6,
}

/**
 * Describes the enum darklake.v1.TradeStatus.
 */
export const TradeStatusSchema: GenEnum<TradeStatus> = enumDesc(file_api, 1);

/**
 * @generated from service darklake.v1.SolanaGatewayService
 */
export const SolanaGatewayService: GenService<{
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.CreateUnsignedTransaction
   */
  createUnsignedTransaction: {
    methodKind: "unary";
    input: typeof CreateUnsignedTransactionRequestSchema;
    output: typeof CreateUnsignedTransactionResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.SendSignedTransaction
   */
  sendSignedTransaction: {
    methodKind: "unary";
    input: typeof SendSignedTransactionRequestSchema;
    output: typeof SendSignedTransactionResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.CheckTradeStatus
   */
  checkTradeStatus: {
    methodKind: "unary";
    input: typeof CheckTradeStatusRequestSchema;
    output: typeof CheckTradeStatusResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.GetTradesListByUser
   */
  getTradesListByUser: {
    methodKind: "unary";
    input: typeof GetTradesListByUserRequestSchema;
    output: typeof GetTradesListByUserResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.GetTokenMetadata
   */
  getTokenMetadata: {
    methodKind: "unary";
    input: typeof GetTokenMetadataRequestSchema;
    output: typeof GetTokenMetadataResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.GetTokenMetadataList
   */
  getTokenMetadataList: {
    methodKind: "unary";
    input: typeof GetTokenMetadataListRequestSchema;
    output: typeof GetTokenMetadataListResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.CreateCustomToken
   */
  createCustomToken: {
    methodKind: "unary";
    input: typeof CreateCustomTokenRequestSchema;
    output: typeof CreateCustomTokenResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.EditCustomToken
   */
  editCustomToken: {
    methodKind: "unary";
    input: typeof EditCustomTokenRequestSchema;
    output: typeof EditCustomTokenResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.DeleteCustomToken
   */
  deleteCustomToken: {
    methodKind: "unary";
    input: typeof DeleteCustomTokenRequestSchema;
    output: typeof DeleteCustomTokenResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.GetCustomTokens
   */
  getCustomTokens: {
    methodKind: "unary";
    input: typeof GetCustomTokensRequestSchema;
    output: typeof GetCustomTokensResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.GetCustomToken
   */
  getCustomToken: {
    methodKind: "unary";
    input: typeof GetCustomTokenRequestSchema;
    output: typeof GetCustomTokenResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.InitPool
   */
  initPool: {
    methodKind: "unary";
    input: typeof InitPoolRequestSchema;
    output: typeof InitPoolResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.AddLiquidity
   */
  addLiquidity: {
    methodKind: "unary";
    input: typeof AddLiquidityRequestSchema;
    output: typeof AddLiquidityResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.RemoveLiquidity
   */
  removeLiquidity: {
    methodKind: "unary";
    input: typeof RemoveLiquidityRequestSchema;
    output: typeof RemoveLiquidityResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.Quote
   */
  quote: {
    methodKind: "unary";
    input: typeof QuoteRequestSchema;
    output: typeof QuoteResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.SolanaGatewayService.QuoteAddLiquidity
   */
  quoteAddLiquidity: {
    methodKind: "unary";
    input: typeof QuoteAddLiquidityRequestSchema;
    output: typeof QuoteAddLiquidityResponseSchema;
  };
}> = serviceDesc(file_api, 0);

/**
 * @generated from service darklake.v1.DarklakeIntegrationsService
 */
export const DarklakeIntegrationsService: GenService<{
  /**
   * @generated from rpc darklake.v1.DarklakeIntegrationsService.Quote
   */
  quote: {
    methodKind: "unary";
    input: typeof QuoteRequestSchema;
    output: typeof QuoteResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.DarklakeIntegrationsService.CreateUnsignedTransaction
   */
  createUnsignedTransaction: {
    methodKind: "unary";
    input: typeof CreateUnsignedTransactionRequestSchema;
    output: typeof CreateUnsignedTransactionResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.DarklakeIntegrationsService.SendSignedTransaction
   */
  sendSignedTransaction: {
    methodKind: "unary";
    input: typeof SendSignedTransactionRequestSchema;
    output: typeof SendSignedTransactionResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.DarklakeIntegrationsService.CheckTradeStatus
   */
  checkTradeStatus: {
    methodKind: "unary";
    input: typeof CheckTradeStatusRequestSchema;
    output: typeof CheckTradeStatusResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.DarklakeIntegrationsService.GetTradesListByUser
   */
  getTradesListByUser: {
    methodKind: "unary";
    input: typeof GetTradesListByUserRequestSchema;
    output: typeof GetTradesListByUserResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.DarklakeIntegrationsService.InitPool
   */
  initPool: {
    methodKind: "unary";
    input: typeof InitPoolRequestSchema;
    output: typeof InitPoolResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.DarklakeIntegrationsService.AddLiquidity
   */
  addLiquidity: {
    methodKind: "unary";
    input: typeof AddLiquidityRequestSchema;
    output: typeof AddLiquidityResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.DarklakeIntegrationsService.RemoveLiquidity
   */
  removeLiquidity: {
    methodKind: "unary";
    input: typeof RemoveLiquidityRequestSchema;
    output: typeof RemoveLiquidityResponseSchema;
  };
  /**
   * @generated from rpc darklake.v1.DarklakeIntegrationsService.QuoteAddLiquidity
   */
  quoteAddLiquidity: {
    methodKind: "unary";
    input: typeof QuoteAddLiquidityRequestSchema;
    output: typeof QuoteAddLiquidityResponseSchema;
  };
}> = serviceDesc(file_api, 1);
